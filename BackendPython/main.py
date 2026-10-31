import math
import hashlib
import os
import smtplib
import ssl
from collections import defaultdict
from email.message import EmailMessage
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Header
from datetime import datetime, timezone, timedelta
from quiz_data import correct_quiz_answers
from quiz_data import quiz_explanations
from fastapi import FastAPI, Depends, HTTPException, Response, Cookie
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from passlib.context import CryptContext
from typing import Literal, Annotated
module_name = Literal["module2", "module3", "module4", "module5", "module6", "module7", "module8", "module9"]
quiz_score_valid = Annotated[int, Field(ge=0, le=5)]
import models
import secrets
from database_creation import engine, SessionLocal
models.Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ADMIN_EMAILS=["test.maker1@gmail.com","adarsh.shankarling1@gmail.com", "steph.webb@commonspirit.org" ]
CURRENT_PRIVACY_VERSION = "2026-10-25"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-CSRF-Token"]
)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authenticate requests using the session cookie and reject missing, invalid, or expired sessions.
def get_current_user_id(session_id: str = Cookie(None), db=Depends(get_db)):
    if session_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    
    session = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()

    if session is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) >= expires_at:
        db.delete(session)
        db.commit()
        raise HTTPException(status_code=401, detail="Session expired.")

    return session.user_id

# Restrict protected features until the user acknowledges the current privacy policy version.
def require_privacy_acknowledgment(
    user_id: int = Depends(get_current_user_id),
    db=Depends(get_db)
):
    acknowledgment = db.query(models.PrivacyAcknowledgment).filter(
        models.PrivacyAcknowledgment.user_id == user_id,
        models.PrivacyAcknowledgment.policy_version == CURRENT_PRIVACY_VERSION
    ).first()

    if acknowledgment is None:
        raise HTTPException(
            status_code=403,
            detail="Privacy policy acknowledgment required."
        )

    return user_id

# Validate the CSRF token against the authenticated session to protect state-changing requests.
def verify_csrf(
    request: Request,
    user_id: int = Depends(get_current_user_id),
    csrf_token: str | None = Header(default=None, alias="X-CSRF-Token"),
    db=Depends(get_db)
):
    session_id = request.cookies.get("session_id")
    session = db.query(models.UserSession).filter(
        models.UserSession.session_id == session_id,
        models.UserSession.user_id == user_id
    ).first()

    if session is None or csrf_token is None or not secrets.compare_digest(csrf_token, session.csrf_token):
        raise HTTPException(status_code=403, detail="Invalid CSRF token.")

    return user_id

def verify_csrf_and_privacy(
    user_id: int = Depends(verify_csrf),
    _: int = Depends(require_privacy_acknowledgment)
):
    return user_id

def hash_password(password: str):
    return pwd_context.hash(password)


def update_last_activity(user_id, db):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is not None:
        user.last_activity = datetime.now(timezone.utc)
        db.commit()



@app.get("/csrf-token")
def get_csrf_token(user_id: int = Depends(get_current_user_id), session_id: str = Cookie(None), db=Depends(get_db)):
    session = db.query(models.UserSession).filter(
        models.UserSession.session_id == session_id,
        models.UserSession.user_id == user_id
    ).first()

    if session is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    return {"csrf_token": session.csrf_token}

@app.get("/me")
def get_me(user_id: int = Depends(get_current_user_id)):
    return {
        "user_id": user_id
    }

@app.get("/privacy-status")
def privacy_status(user_id: int = Depends(get_current_user_id), db=Depends(get_db)):
    acknowledgment = db.query(models.PrivacyAcknowledgment).filter(
        models.PrivacyAcknowledgment.user_id == user_id,
        models.PrivacyAcknowledgment.policy_version == CURRENT_PRIVACY_VERSION
    ).first()

    return {
        "accepted": acknowledgment is not None,
        "policy_version": CURRENT_PRIVACY_VERSION
    }

@app.post("/accept-privacy")
def accept_privacy(user_id: int = Depends(verify_csrf), db=Depends(get_db)):
    acknowledgment = db.query(models.PrivacyAcknowledgment).filter(
        models.PrivacyAcknowledgment.user_id == user_id,
        models.PrivacyAcknowledgment.policy_version == CURRENT_PRIVACY_VERSION
    ).first()

    if acknowledgment is None:
        acknowledgment = models.PrivacyAcknowledgment(
            user_id=user_id,
            policy_version=CURRENT_PRIVACY_VERSION,
            acknowledged_at=datetime.now(timezone.utc)
        )

        db.add(acknowledgment)
        db.commit()

    return {"accepted": True}

# Apply security headers to reduce browser-based risks such as clickjacking and content-type sniffing.
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "frame-ancestors 'none'"
    return response





@app.post("/logout")
def logout(response: Response, session_id: str = Cookie(None), db=Depends(get_db)):
    if session_id is not None:
        session = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()

        if session is not None:
            update_last_activity(session.user_id, db)
            db.delete(session)
            db.commit()

    response.delete_cookie(key="session_id")
    return {"message": "Logout successful"}





class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    privacy_accepted: bool
    @field_validator("privacy_accepted")
    @classmethod
    def validate_privacy_accepted(cls, value: bool):
        if value is not True:
            raise ValueError("You must acknowledge the Privacy and Data Use Notice.")
        return value
    
    @field_validator("first_name", "last_name")
    @classmethod
    def validate_name(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty or contain only spaces.")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 bytes.")
        return value

    
    
    
@app.post("/register")
@limiter.limit("3/minute")
def register(request: Request, user: UserCreate, db = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )
    if len(user.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=422, detail="Password must not exceed 72 bytes.")

    hashed_password = hash_password(user.password)
    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name
    )
    db.add(new_user)
    db.flush()
    db.refresh(new_user)

    acknowledgment = models.PrivacyAcknowledgment(
        user_id=new_user.id,
        policy_version=CURRENT_PRIVACY_VERSION,
        acknowledged_at=datetime.now(timezone.utc)
    )
    db.add(acknowledgment)


    for i in range(1,11):
        required=False
        if i==1 or i==10:
            required=True
        module=models.ModuleData(
            user_id=new_user.id,
            module_id=i,
            progress=0,
            status="Not Started",
            required=required
        )
        db.add(module)

    for quiz_type in ["preQuiz", "postQuiz", "miniQuiz"]:
        quiz_answers = models.UserQuizAnswers(
            user_id=new_user.id,
            module_type=quiz_type,
            module_answer_list=[None] * 40
        )
        db.add(quiz_answers)

    for quiz_type in ["miniQuiz", "preQuiz", "postQuiz"]:
        for module_id in range (2,10):
            quiz_score = models.QuizScores(
                user_id=new_user.id,
                module_type=quiz_type,
                module_id=module_id,
                score=None
            )
            db.add(quiz_score)

    db.commit()
    return {
        "message": "Account created successfully",
        "user_id": new_user.id
        }



class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 bytes.")
        return value

# Authenticate credentials and create an eight-hour session with a unique session ID and CSRF token.
@app.post("/login")
@limiter.limit("5/minute")
def login(request: Request, user: UserLogin, response: Response, db=Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )
    password_correct = pwd_context.verify(user.password, db_user.password_hash)
    if not password_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    session_id = secrets.token_urlsafe(32)
    csrf_token = secrets.token_hex(32)

    new_session = models.UserSession(
        user_id=db_user.id,
        session_id=session_id,
        csrf_token=csrf_token,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=8)
    )
    db.add(new_session)
    db.commit()

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=os.getenv("ENVIRONMENT") == "production",
        max_age=60 * 60 * 8
    )
    update_last_activity(db_user.id, db)
    return {
        "message": "Login successful",
        "user_id": db_user.id,
        "is_admin": db_user.email.lower() in ADMIN_EMAILS
    }


def send_reset_email(recipient_email: str, reset_link: str):
    sender = os.environ["SMTP_EMAIL"]
    app_password = os.environ["SMTP_APP_PASSWORD"]

    message = EmailMessage()
    message["From"] = f"Volentera Support <{sender}>"
    message["To"] = recipient_email
    message["Subject"] = "Reset your Volentera password"
    message.set_content(
        f"Someone requested a password reset for your Volentera account.\n\n"
        f"Reset your password here:\n{reset_link}\n\n"
        "This link expires in 30 minutes. If you didn't request this, ignore this email."
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ssl.create_default_context(), timeout=15) as smtp:
        smtp.login(sender, app_password)
        smtp.send_message(message)



class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# Generate a time-limited password reset token and store only its SHA-256 hash in the database.
@app.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, data: ForgotPasswordRequest, db=Depends(get_db)):
    message = "If an account exists with this email, a password reset link will be sent."

    user = db.query(models.User).filter(models.User.email == data.email).first()

    if user is not None:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        reset_record = models.PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
        )

        db.add(reset_record)
        db.commit()

        reset_link = f"https://volentera.com/reset-password/reset-password.html?token={token}"
        try:
            send_reset_email(user.email, reset_link)
        except (smtplib.SMTPException, OSError) as exc:
            print(f"Password-reset email delivery failed: {type(exc).__name__}")

    return {"message": message}



class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1, max_length=45)
    new_password: str = Field(min_length=12)

@app.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, data: ResetPasswordRequest, db=Depends(get_db)):
    token_hash = hashlib.sha256(data.token.encode()).hexdigest()

    reset_record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token_hash == token_hash,
        models.PasswordResetToken.used_at.is_(None)
    ).first()

    if reset_record is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    expires_at = reset_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    user = db.query(models.User).filter(models.User.id == reset_record.user_id).first()
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    if len(data.new_password.encode("utf-8")) > 72:
        raise HTTPException(status_code=422, detail="Password must not exceed 72 bytes.")
    user.password_hash = hash_password(data.new_password)

    reset_record.used_at = datetime.now(timezone.utc)

    # Invalidate all other outstanding reset links for this user.
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.id != reset_record.id,
        models.PasswordResetToken.used_at.is_(None)
    ).update({"used_at": datetime.now(timezone.utc)}, synchronize_session=False)

    # Invalidate existing sessions for this account.
    db.query(models.UserSession).filter(models.UserSession.user_id == user.id).delete(synchronize_session=False)
    db.commit()

    return {"message": "Password reset successfully. You can now log in."}

@app.get("/check-session")
def check_session(user_id: int = Depends(get_current_user_id), db = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    return {
        "logged_in": True,
        "first_name": db_user.first_name,
        "last_name": db_user.last_name
    }

@app.get("/get-my-account")
def get_my_account(user_id: int = Depends(get_current_user_id), db=Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    return {
        "id": db_user.id,
        "email": db_user.email,
        "first_name": db_user.first_name,
        "last_name": db_user.last_name
    }



# Aggregate volunteer records, module progress, and assessment scores into individual performance summaries.
def get_admin_user_data(db):
    users = db.query(models.User).all()
    modules = db.query(models.ModuleData).all()
    quiz_scores = db.query(models.QuizScores).all()

    modules_by_user = defaultdict(list)
    scores_by_user = defaultdict(lambda: defaultdict(list))

    for module in modules:
        modules_by_user[module.user_id].append(module)

    for score in quiz_scores:
        scores_by_user[score.user_id][score.module_type].append(score)

    admin_users_data = []

    for user in users:
        user_modules = modules_by_user[user.id]
        pre_scores = scores_by_user[user.id]["preQuiz"]
        post_scores = scores_by_user[user.id]["postQuiz"]

        pre_completed = len(pre_scores) == 8 and all(score.score is not None for score in pre_scores)
        post_completed = len(post_scores) == 8 and all(score.score is not None for score in post_scores)

        pre_total = sum(score.score for score in pre_scores) if pre_completed else None
        post_total = sum(score.score for score in post_scores) if post_completed else None

        pre_percentage = (pre_total / 40) * 100 if pre_completed else None
        post_percentage = (post_total / 40) * 100 if post_completed else None

        pre_status = next((module.status for module in user_modules if module.module_id == 1), "Not Started")
        post_status = next((module.status for module in user_modules if module.module_id == 10), "Not Started")

        if post_status == "Completed":
            status = "Completed"
        elif pre_status == "Not Started":
            status = "Not Started"
        else:
            status = "In Progress"

        # Require both a minimum overall post-assessment score and atleast four correct answers in every topic.
        passed = post_completed and post_total >= 37 and all(score.score >= 4 for score in post_scores)

        admin_users_data.append({
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "modules_completed": f"{sum(module.status == 'Completed' for module in user_modules)} / {len(user_modules)}",
            "pre_quiz_score": math.floor(pre_percentage) if pre_completed else None,
            "post_quiz_score": math.floor(post_percentage) if post_completed else None,
            "improvement": math.floor(post_percentage - pre_percentage) if pre_completed and post_completed else None,
            "passed": passed,
            "status": status,
            "last_activity": user.last_activity,
            "training_seconds": user.training_seconds or 0,
            "required_completion": (
                sum(module.progress == 100 for module in user_modules if module.required)
                / sum(module.required for module in user_modules) * 100
                if any(module.required for module in user_modules) else None
            ),
            "exact_improvement": post_percentage - pre_percentage if pre_completed and post_completed else None
        })

    return admin_users_data

@app.get("/get-admin-status")
def get_admin_status(user_id: int = Depends(get_current_user_id), db=Depends(get_db)):
    user_email = db.query(models.User).filter(models.User.id == user_id).first().email

    return user_email.lower() in ADMIN_EMAILS


@app.get("/get-admin-data")
def get_admin_data(user_id: int = Depends(require_privacy_acknowledgment), db=Depends(get_db)):
    current_user = db.query(models.User).filter(models.User.id == user_id).first()

    if current_user is None or current_user.email.lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required.")

    admin_users_data = get_admin_user_data(db)

    for user_data in admin_users_data:
        del user_data["id"]
        del user_data["training_seconds"]
        del user_data["required_completion"]
        del user_data["exact_improvement"]

    return admin_users_data

@app.get("/get-admin-metrics")
def get_admin_metrics(user_id: int = Depends(require_privacy_acknowledgment), db=Depends(get_db)):
    current_user = db.query(models.User).filter(models.User.id == user_id).first()

    if current_user is None or current_user.email.lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required.")

    users = get_admin_user_data(db)
    total_users = len(users)

    # Average required module completion
    completion_percentages = [
        user["required_completion"]
        for user in users
        if user["required_completion"] is not None
    ]

    average_completion = (
        round(sum(completion_percentages) / len(completion_percentages))
        if completion_percentages else 0
    )

    # Number and percentage of users who passed the post-quiz
    passed_post_quiz = sum(user["passed"] for user in users)
    passed_percentage = round((passed_post_quiz / total_users) * 100) if total_users else 0
    passed_post_quiz_display = f"{passed_post_quiz} ({passed_percentage}%)"

    # Total training time
    total_training_seconds = sum(user["training_seconds"] for user in users)
    hours, remaining_seconds = divmod(total_training_seconds, 3600)
    minutes = remaining_seconds // 60
    total_training_time = f"{hours}h {minutes}m"

    # Average pre-quiz to post-quiz improvement
    improvements = [
        user["exact_improvement"]
        for user in users
        if user["exact_improvement"] is not None
    ]

    average_improvement = (
        round(sum(improvements) / len(improvements), 1)
        if improvements else 0
    )

    return {
        "total_users": total_users,
        "average_required_completion": average_completion,
        "passed_post_quiz": passed_post_quiz_display,
        "total_training_time": total_training_time,
        "average_improvement": average_improvement
    }

    
class TrainingTimeRequest(BaseModel):
    seconds: int = Field(ge=1, le=60)

@app.post("/save-training-time", status_code=204)
@limiter.limit("5/minute")
def save_training_time(request: Request, data: TrainingTimeRequest, user_id: int = Depends(verify_csrf_and_privacy), db=Depends(get_db)):
    if data.seconds <= 0 or data.seconds > 60:
        raise HTTPException(status_code=400, detail="Invalid training duration.")

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    user.training_seconds += data.seconds
    db.commit()


@app.get("/get-module-data")
def get_my_modules(user_id: int = Depends(require_privacy_acknowledgment), db=Depends(get_db)):
    modules_to_return=[]
    module_rows = db.query(models.ModuleData).filter(models.ModuleData.user_id == user_id).all() 
    for module_row in module_rows:
        module_info={}
        for module_key in ["module_id","progress", "status", "required"]:
            module_info[module_key]=getattr(module_row,module_key)
        modules_to_return.append(module_info)
    
    return modules_to_return


@app.get("/get-quiz-scores")
def get_my_quiz_scores(user_id: int = Depends(require_privacy_acknowledgment), db=Depends(get_db)):
    scores_to_return=[
                        {"type": "miniQuiz",},
                        {"type": "preQuiz", "overallScore": None},
                        {"type": "postQuiz", "overallScore": None}
                    ]
    score_rows = db.query(models.QuizScores).filter(models.QuizScores.user_id == user_id).all() 
    for score_row in score_rows:
        quiz_score_data=next((quiz_name for quiz_name in scores_to_return if quiz_name["type"] == score_row.module_type), None)
        quiz_score_data[f"module{score_row.module_id}"]=score_row.score
    for quiz_score_data in scores_to_return:
        if quiz_score_data["type"] in ["preQuiz", "postQuiz"]:
            all_scores_exist = all(quiz_score_data[f"module{i}"] is not None for i in range(2, 10))
            if all_scores_exist:
                quiz_score_data["overallScore"] = 0
                for i in range(2, 10):
                    quiz_score_data["overallScore"]=quiz_score_data["overallScore"]+quiz_score_data[f"module{i}"]

    return scores_to_return

@app.get("/get-quiz-answers")
def get_my_quiz_answers(user_id: int = Depends(require_privacy_acknowledgment), db=Depends(get_db)):
    answers_to_return = {"preQuiz": [], "postQuiz": [], "miniQuiz": [], "previousMiniQuiz": []}
    answer_rows = db.query(models.UserQuizAnswers).filter(models.UserQuizAnswers.user_id == user_id).all()

    for answer_row in answer_rows:
        answers_to_return[answer_row.module_type] = answer_row.module_answer_list
        if answer_row.module_type == "miniQuiz":
            answers_to_return["previousMiniQuiz"] = answer_row.previous_answer_list or []

    return answers_to_return

@app.get("/get-quiz-review")
def get_my_quiz_review(quiz_type: str, module_id: int|None=None, user_id: int = Depends(verify_csrf_and_privacy), db=Depends(get_db)):

    if quiz_type == "miniQuiz":
        if module_id is None or not (2 <= module_id <= 9):
            raise HTTPException(status_code=400, detail="Invalid module ID.")

    elif quiz_type in ["preQuiz", "postQuiz"]:
        if module_id is not None:
            raise HTTPException(status_code=400, detail="Module ID should not be provided for this quiz type.")

    else:
        raise HTTPException(status_code=400, detail="Invalid quiz type.")

    if quiz_type=="miniQuiz":
        module_score= db.query(models.QuizScores).filter(models.QuizScores.user_id == user_id, models.QuizScores.module_type == quiz_type, models.QuizScores.module_id == module_id).first()
        if module_score is None or module_score.score is None:
            raise HTTPException(
                status_code=400,
                detail="Quiz must be completed before reviewing answers."
            )
    else:
        module_scores= db.query(models.QuizScores).filter(models.QuizScores.user_id == user_id, models.QuizScores.module_type == quiz_type).all()
        if len(module_scores) != 8:
            raise HTTPException(
                status_code=400,
                detail="Quiz must be completed before reviewing answers."
            )
        for module_score in module_scores:
            if module_score.score is None:
                raise HTTPException(
                    status_code=400,
                    detail="Quiz must be completed before reviewing answers."
                )
    saved_answers=db.query(models.UserQuizAnswers).filter(models.UserQuizAnswers.user_id == user_id, models.UserQuizAnswers.module_type == quiz_type).first()
    if saved_answers is None:
        raise HTTPException(
            status_code=400,
            detail="Quiz answers could not be found."
        )
    
    if quiz_type == "miniQuiz":
        start_index = (module_id - 2) * 5
        previous = saved_answers.previous_answer_list or []
        specific_quiz_answers = previous[start_index:start_index + 5]
    elif quiz_type == "postQuiz":
        if not saved_answers.post_quiz_review_allowed:
            return False
        specific_quiz_answers = saved_answers.previous_answer_list or []
    else:
        specific_quiz_answers = saved_answers.module_answer_list
    if len(specific_quiz_answers) != (5 if quiz_type == "miniQuiz" else 40):
        raise HTTPException(status_code=400, detail="Saved quiz review answers are incomplete.")
    return answer_check(quiz_type, specific_quiz_answers, module_id)

class ModuleProgressUpdate(BaseModel):
    module_id: int = Field(ge=1, le=10)
    progress: int = Field(ge=0, le=100)


# Validate progress updates and prevent modules from being marked complete before their assessments are submitted.
@app.post("/update-module-progress")
@limiter.limit("50/minute")
def update_module_progress(request: Request,module: ModuleProgressUpdate, user_id: int = Depends(verify_csrf_and_privacy), db=Depends(get_db)):
    if module.module_id == 1:
        module_type = "preQuiz"
    elif 2 <= module.module_id <= 9:
        module_type = "miniQuiz"
        if module.progress not in [0, 20, 40, 60, 80, 100]:
            raise HTTPException(status_code=400, detail="Invalid module progress.")
                    
    elif module.module_id == 10:
        module_type = "postQuiz"
    else:
        raise HTTPException(status_code=400, detail="Invalid module.")

    specific_module_data = db.query(models.ModuleData).filter(models.ModuleData.user_id == user_id, models.ModuleData.module_id == module.module_id).first()
    if specific_module_data is None:
        raise HTTPException(status_code=400, detail="Invalid module.")
    
    if module.progress < specific_module_data.progress:
        raise HTTPException(
            status_code=400,
            detail="Module progress cannot decrease or be the same."
        )
    if module.progress==100:
        if module_type=="miniQuiz":
            module_score= db.query(models.QuizScores).filter(models.QuizScores.user_id == user_id, models.QuizScores.module_type == module_type, models.QuizScores.module_id == module.module_id).first()
            if module_score is None or module_score.score is None:
                raise HTTPException(
                    status_code=400,
                    detail="Quiz must be completed before module completion."
                )
        else:
            module_scores= db.query(models.QuizScores).filter(models.QuizScores.user_id == user_id, models.QuizScores.module_type == module_type).all()
            if len(module_scores) != 8:
                raise HTTPException(
                    status_code=400,
                    detail="Quiz must be completed before module completion."
                )
            for module_score in module_scores:
                if module_score.score is None:
                    raise HTTPException(
                        status_code=400,
                        detail="Quiz must be completed before module completion."
                    )
    specific_module_data.progress = module.progress

    if module.progress == 0:
        specific_module_data.status = "Not Started"
    elif module.progress == 100:
        specific_module_data.status = "Completed"
    else:
        specific_module_data.status = "In Progress"
    db.commit()

class QuizScoreUpdate(BaseModel):
    module_type: Literal["miniQuiz", "preQuiz", "postQuiz"]
    module_scores: dict[module_name, quiz_score_valid | None]


def update_quiz_scores(data: QuizScoreUpdate, user_id: int, db):
    for module, score in data.module_scores.items():
        moduleID = int(module.replace("module", ""))
        specific_quiz_score = db.query(models.QuizScores).filter(models.QuizScores.user_id == user_id, models.QuizScores.module_type == data.module_type, models.QuizScores.module_id == moduleID).first()
        specific_quiz_score.score=score
    db.commit()

# Identify knowledge gaps from pre-assessment scores and mark the corresponding training modules as required.
def update_required_modules(quiz_scores_li, quiz_type, user_id: int, db):
    user_module = db.query(models.ModuleData).filter(models.ModuleData.user_id == user_id, models.ModuleData.module_id.notin_([1, 10])).order_by(models.ModuleData.module_id).all()
    for i in range(0,8):
        if quiz_scores_li[i]<=4:
            user_module[i].required=True
    db.commit()


class QuizAnswersUpdate(BaseModel):
    module_type: Literal["miniQuiz", "preQuiz", "postQuiz"]
    module_answer_list: list[Literal["A", "B", "C", "D"] | None] = Field(min_length=40, max_length=40)



@app.post("/update-quiz-answers")
@limiter.limit("10/minute")
def update_quiz_answers(request: Request, data: QuizAnswersUpdate, user_id: int = Depends(verify_csrf_and_privacy), db=Depends(get_db)):
    user_quiz_answers = db.query(models.UserQuizAnswers).filter(models.UserQuizAnswers.user_id == user_id, models.UserQuizAnswers.module_type ==data.module_type).first()
    if user_quiz_answers is None:
        raise HTTPException(
            status_code=400,
            detail="Quiz answers could not be found."
        )
    user_quiz_answers.module_answer_list=data.module_answer_list
    db.commit()






class QuizSubmission(BaseModel):
    quizType: Literal["miniQuiz", "preQuiz", "postQuiz"]
    answers: list[Literal["A", "B", "C", "D"]]
    moduleID: int | None = Field(default=None, ge=1)

    # Validate the number of answers and module ID based on the assessment type before accepting a submission.
    @model_validator(mode="after")
    def validate_submission(self):
        if self.quizType == "miniQuiz":
            if len(self.answers) != 5 or self.moduleID not in range(2, 10):
                raise ValueError("Invalid mini-quiz submission.")
        else:
            expected_id = 1 if self.quizType == "preQuiz" else 10
            if len(self.answers) != 40 or self.moduleID != expected_id:
                raise ValueError("Invalid pre/post-quiz submission.")
        return self
    
# Grade submitted answers, persist assessment scores, and update the volunteer's training requirements or review history.
@app.post("/submit-quiz")
@limiter.limit("5/minute")
def quiz_submission_check(request: Request, submission: QuizSubmission, user_id: int = Depends(verify_csrf_and_privacy), db=Depends(get_db)): 
    
    quiz_type = submission.quizType
    user_answers_li= submission.answers
    module_id=submission.moduleID

    quiz_review_results=answer_check(quiz_type, user_answers_li, module_id)
    quiz_scores=quiz_review_results["quizScore"]
    quiz_scores_dict={}
    if isinstance(quiz_scores, int):
        quiz_scores_dict[f"module{module_id}"]=quiz_scores
    else:
        for i in range(2,10):
            quiz_scores_dict[f"module{i}"]=quiz_scores[i-2]


    update_quiz_scores_dict=QuizScoreUpdate(module_type =quiz_type, module_scores = quiz_scores_dict)
    update_quiz_scores(update_quiz_scores_dict, user_id, db)
    if quiz_type == "miniQuiz":
        saved_answers = db.query(models.UserQuizAnswers).filter(
            models.UserQuizAnswers.user_id == user_id,
            models.UserQuizAnswers.module_type == "miniQuiz"
        ).first()

        # Preserve the latest completed mini-quiz attempt for review and clear its active answers to support retakes.
        start = (module_id - 2) * 5
        current = list(saved_answers.module_answer_list)
        previous = list(saved_answers.previous_answer_list or [None] * 40)

        previous[start:start + 5] = user_answers_li
        current[start:start + 5] = [None] * 5

        saved_answers.module_answer_list = current
        saved_answers.previous_answer_list = previous
        db.commit()
    elif quiz_type=="postQuiz":
        saved_answers = db.query(models.UserQuizAnswers).filter(
                models.UserQuizAnswers.user_id == user_id,
                models.UserQuizAnswers.module_type == "postQuiz"
                ).first()
        
        saved_answers.previous_answer_list = list(user_answers_li)
        saved_answers.module_answer_list = [None] * 40

        saved_answers.post_quiz_review_allowed = True
        
        db.commit()

    elif quiz_type=="preQuiz":
        update_required_modules(quiz_scores, quiz_type, user_id, db)

    

    return quiz_review_results

        

# Compare submitted answers against the answer key and return question-level feedback and scores.
def answer_check(quiz_type, user_answers_li, module_id):
    question_check_results_li=[]
    
    if quiz_type=="miniQuiz":
        index_start=(module_id-2)*5
        correct_answers_li=correct_quiz_answers[quiz_type][index_start:index_start+5]
        quiz_explanations_li=quiz_explanations[quiz_type][index_start:index_start+5]
    else:
        correct_answers_li=correct_quiz_answers[quiz_type]
        quiz_explanations_li=quiz_explanations[quiz_type]

    for i in range(0, len(correct_answers_li)):
        answer=user_answers_li[i]
        if answer==correct_answers_li[i]:
            question_check_results_li.append(True)
        else: 
            question_check_results_li.append(False)
    quiz_score=score_quiz(quiz_type, question_check_results_li) 
    return {"correctAnswers": correct_answers_li,
            "explanations": quiz_explanations_li,
            "questionResults": question_check_results_li,
            "quizScore": quiz_score}

# Calculate mini-quiz scores directly or group full-assessment results into eight five-question topic scores.
def score_quiz(quiz_type, question_check_results_li):
    if quiz_type=="miniQuiz":
        quiz_score=len(list(filter(lambda correct: correct == True, question_check_results_li)))
        return quiz_score
    elif quiz_type=="preQuiz" or quiz_type=="postQuiz":
        quiz_score_li=[]
        correct_per_module=0
        for i in range(0, len(question_check_results_li)):
            if question_check_results_li[i]==True:
                correct_per_module+=1
            if ((i+1)%5)==0:
                quiz_score_li.append(correct_per_module)
                correct_per_module=0
        return quiz_score_li



@app.post("/close-post-quiz-review")
def close_post_quiz_review(user_id: int = Depends(verify_csrf_and_privacy), db=Depends(get_db)):
    saved_answers = db.query(models.UserQuizAnswers).filter(
        models.UserQuizAnswers.user_id == user_id,
        models.UserQuizAnswers.module_type == "postQuiz"
    ).first()

    if saved_answers:
        saved_answers.post_quiz_review_allowed = False
        db.commit()

    return {"success": True}
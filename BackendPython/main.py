import math
import hashlib
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone, timedelta
from quiz_data import correct_quiz_answers
from quiz_data import quiz_explanations
from fastapi import FastAPI, Depends, HTTPException, Response, Cookie
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from typing import Literal, Annotated
module_name = Literal["module2", "module3", "module4", "module5", "module6", "module7", "module8", "module9"]
quiz_score_valid = Annotated[int, Field(ge=0, le=5)]
import models
import secrets
from database_creation import engine, SessionLocal
models.Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
sessions = {}
ADMIN_EMAILS=["test.maker@gmail.com","adarsh.shankarling1@gmail.com", "steph.webb@commonspirit.org" ]

def get_current_user_id(session_id: str = Cookie(None)):
    if session_id is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated."
        )
    if session_id not in sessions:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated."
        )
    return sessions[session_id]

def hash_password(password: str):
    return pwd_context.hash(password)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def update_last_activity(user_id, db):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is not None:
        user.last_activity = datetime.now(timezone.utc)
        db.commit()

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str  


class UserLogin(BaseModel):
    email: str
    password: str


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/me")
def get_me(user_id: int = Depends(get_current_user_id)):
    return {
        "user_id": user_id
    }



@app.post("/logout")
def logout(response: Response, session_id: str = Cookie(None), db=Depends(get_db)):
    if session_id in sessions:
        user_id = sessions[session_id]
        update_last_activity(user_id, db)
        del sessions[session_id]

    response.delete_cookie(key="session_id")
    return {"message": "Logout successful"}

@app.post("/register")
def register(user: UserCreate, db = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )
    hashed_password = hash_password(user.password)
    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
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


@app.post("/login")
def login(user: UserLogin, response: Response, db=Depends(get_db)):
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
    sessions[session_id] = db_user.id
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60 * 60 * 8
    )
    update_last_activity(db_user.id, db)
    return {
        "message": "Login successful",
        "user_id": db_user.id
    }

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@app.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db=Depends(get_db)):
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

        # LOCAL DEVELOPMENT ONLY — replace with email delivery before deployment.
        reset_link = f"http://127.0.0.1:5500/reset-password/reset-password.html?token={token}"
        print(f"DEV ONLY password reset link: {reset_link}")

    return {"message": message}


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


@app.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db=Depends(get_db)):
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

    user.password_hash = hash_password(data.new_password)
    reset_record.used_at = datetime.now(timezone.utc)

    # Invalidate all other outstanding reset links for this user.
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.id != reset_record.id,
        models.PasswordResetToken.used_at.is_(None)
    ).update({"used_at": datetime.now(timezone.utc)}, synchronize_session=False)

    db.commit()

    # Invalidate existing sessions for this account.
    for session_id, session_user_id in list(sessions.items()):
        if session_user_id == user.id:
            del sessions[session_id]

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

@app.get("/get-admin-data")
def get_admin_data(user_id: int = Depends(get_current_user_id), db=Depends(get_db)):

    current_user = db.query(models.User).filter(models.User.id == user_id).first()
    if current_user is None or current_user.email.lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required.")
        
    admin_users_data_li=[]
    users = db.query(models.User).all()
    # Getting each individual row of the users SQL database that holds the user data
    for user in users:
        # creating a user info template that will be appended
        user_template_info={
                "first_name": "",
                "last_name": "",
                "email": "",
                "modules_completed": "",
                "pre_quiz_score": None,
                "post_quiz_score": None,
                "improvement": None,
                "passed": False,
                "status": "",
                "last_activity": ""
            }
        # find and add name and email for the user
        user_template_info["first_name"]=user.first_name
        user_template_info["last_name"]=user.last_name
        user_template_info["email"]=user.email

        # find and add the number of modules completed for the user
        user_modules=db.query(models.ModuleData).filter(models.ModuleData.user_id == user.id).all()
        completed_modules=0
        for user_module in user_modules:
            if user_module.status=="Completed":
                completed_modules+=1
        user_template_info["modules_completed"]=f"{completed_modules} / {len(user_modules)}"

        # find and add the status of the user
        pre_quiz_status = next(module.status for module in user_modules if module.module_id == 1)
        post_quiz_status = next(module.status for module in user_modules if module.module_id == 10)
        if post_quiz_status=="Completed":
            user_template_info["status"]="Completed"
        elif pre_quiz_status=="Not Started":
            user_template_info["status"]="Not Started"
        else:
            user_template_info["status"]="In Progress"

        # find and add the pre quiz scores for the user
        pre_quiz_scores=db.query(models.QuizScores).filter(models.QuizScores.user_id == user.id, models.QuizScores.module_type== "preQuiz").all()
        overall_pre_quiz_score=0
        pre_quiz_completed = len(pre_quiz_scores) == 8
        for pre_quiz_score_row in pre_quiz_scores:
            if pre_quiz_score_row.score==None:
                pre_quiz_completed = False
                break
            overall_pre_quiz_score+=pre_quiz_score_row.score
        if pre_quiz_completed:
            user_template_info["pre_quiz_score"]= math.floor((overall_pre_quiz_score/40)*100)
        
        # find and add the post quiz scores for the user
        post_quiz_scores=db.query(models.QuizScores).filter(models.QuizScores.user_id == user.id, models.QuizScores.module_type== "postQuiz").all()
        overall_post_quiz_score=0
        post_quiz_completed = len(post_quiz_scores) == 8
        for post_quiz_score_row in post_quiz_scores:
            if post_quiz_score_row.score==None:
                post_quiz_completed = False
                break
            overall_post_quiz_score+=post_quiz_score_row.score
        if post_quiz_completed:
            user_template_info["post_quiz_score"]= math.floor((overall_post_quiz_score/40)*100)

        # calculate and add the improvement between pre and post quiz score
        if pre_quiz_completed and post_quiz_completed:
            user_template_info["improvement"]= math.floor(((overall_post_quiz_score/40)*100)-((overall_pre_quiz_score/40)*100))
    
        # calculate and add if the user passed:
        if post_quiz_completed:
            individual_module_scores_passed=True
            for post_quiz_score_row in post_quiz_scores:
                if post_quiz_score_row.score<4:
                    individual_module_scores_passed=False
            if overall_post_quiz_score>=37 and individual_module_scores_passed:
                user_template_info["passed"]=True

        user_template_info["last_activity"]=user.last_activity
        admin_users_data_li.append(user_template_info)

    return admin_users_data_li

@app.get("/get-module-data")
def get_my_modules(user_id: int = Depends(get_current_user_id), db=Depends(get_db)):
    modules_to_return=[]
    module_rows = db.query(models.ModuleData).filter(models.ModuleData.user_id == user_id).all() 
    for module_row in module_rows:
        module_info={}
        for module_key in ["module_id","progress", "status", "required"]:
            module_info[module_key]=getattr(module_row,module_key)
        modules_to_return.append(module_info)
    
    return modules_to_return


@app.get("/get-quiz-scores")
def get_my_quiz_scores(user_id: int = Depends(get_current_user_id), db=Depends(get_db)):
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
def get_my_quiz_answers(user_id: int = Depends(get_current_user_id), db=Depends(get_db)):
    answers_to_return = {"preQuiz": [], "postQuiz": [], "miniQuiz": [], "previousMiniQuiz": []}
    answer_rows = db.query(models.UserQuizAnswers).filter(models.UserQuizAnswers.user_id == user_id).all()

    for answer_row in answer_rows:
        answers_to_return[answer_row.module_type] = answer_row.module_answer_list
        if answer_row.module_type == "miniQuiz":
            answers_to_return["previousMiniQuiz"] = answer_row.previous_answer_list or []

    return answers_to_return

@app.get("/get-quiz-review")
def get_my_quiz_review(quiz_type: str, module_id: int|None=None, user_id: int = Depends(get_current_user_id), db=Depends(get_db)):

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
    else:
        specific_quiz_answers = saved_answers.module_answer_list
    return answer_check(quiz_type, specific_quiz_answers, module_id)

class ModuleProgressUpdate(BaseModel):
    module_id: int = Field(ge=1, le=10)
    progress: int = Field(ge=0, le=100)


@app.post("/update-module-progress")
def update_module_progress(module: ModuleProgressUpdate, user_id: int = Depends(get_current_user_id), db=Depends(get_db)):
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

# @app.post("/update-quiz-scores")
def update_quiz_scores(data: QuizScoreUpdate, user_id: int, db):
    for module, score in data.module_scores.items():
        moduleID = int(module.replace("module", ""))
        specific_quiz_score = db.query(models.QuizScores).filter(models.QuizScores.user_id == user_id, models.QuizScores.module_type == data.module_type, models.QuizScores.module_id == moduleID).first()
        specific_quiz_score.score=score
    db.commit()

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
def update_quiz_answers(data: QuizAnswersUpdate, user_id: int = Depends(get_current_user_id), db=Depends(get_db)):
    user_quiz_answers = db.query(models.UserQuizAnswers).filter(models.UserQuizAnswers.user_id == user_id, models.UserQuizAnswers.module_type ==data.module_type).first()
    if user_quiz_answers is None:
        raise HTTPException(
            status_code=400,
            detail="Quiz answers could not be found."
        )
    user_quiz_answers.module_answer_list=data.module_answer_list
    db.commit()






class QuizSubmission(BaseModel):
    quizType: str
    answers: list[str | None]
    moduleID: int | None = None

@app.post("/submit-quiz")
def quiz_submission_check(submission: QuizSubmission, user_id: int = Depends(get_current_user_id), db=Depends(get_db)): 
    quiz_type = submission.quizType
    user_answers_li= submission.answers
    module_id=submission.moduleID
    proper_submission=True
    if quiz_type=="miniQuiz":
        if len(user_answers_li)!=5 or module_id is None or not (2 <= module_id <= 9):
            proper_submission=False
        
    elif quiz_type =="preQuiz" or quiz_type=="postQuiz":
        if len(user_answers_li)!=40 or module_id!=None:
            proper_submission=False
    else:
        proper_submission=False

    if proper_submission:
        for answer in user_answers_li:
            if answer not in ["A","B","C","D"]:
                proper_submission=False
    if not proper_submission:
        raise HTTPException(
            status_code=400,
            detail="Invalid quiz submission."
        )
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

        start = (module_id - 2) * 5
        current = list(saved_answers.module_answer_list)
        previous = list(saved_answers.previous_answer_list or [None] * 40)

        previous[start:start + 5] = user_answers_li
        current[start:start + 5] = [None] * 5

        saved_answers.module_answer_list = current
        saved_answers.previous_answer_list = previous
        db.commit()
    if quiz_type=="preQuiz":
        update_required_modules(quiz_scores, quiz_type, user_id, db)

    return quiz_review_results

        


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
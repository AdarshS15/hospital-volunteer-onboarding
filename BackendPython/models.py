from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, UniqueConstraint, DateTime
from database_creation import Base

# Store volunteer account information and cumulative training activity.
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    last_activity = Column(DateTime(timezone=True), nullable=True)
    training_seconds = Column(Integer, nullable=False, default=0)

# Store hashed, time-limited password reset tokens to prevent token reuse.   
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

# Track each volunteer's module progress and adaptive training requirements.
class ModuleData(Base):
    __tablename__ = "module_data"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_id = Column(Integer, nullable=False)
    progress = Column(Integer, nullable=False)
    status = Column(String, nullable=False)
    required = Column(Boolean, nullable=False)
    __table_args__ = (
        UniqueConstraint("user_id", "module_id"),
    )

# Store topic-level scores for pre-assessments, post-assessments, and mini-quizzes.
class QuizScores(Base):
    __tablename__ = "module_quiz_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_type = Column(String, nullable=False)
    module_id = Column(Integer, nullable=False)
    score = Column(Integer, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "module_type", "module_id"),
    )

# Preserve active and previous quiz answers to support progress restoration, retakes, and answer reviews.
class UserQuizAnswers(Base):
    __tablename__ = "user_quiz_answers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_type = Column(String, nullable=False)
    module_answer_list=Column(JSON, nullable=False)
    previous_answer_list = Column(JSON, nullable=True)
    post_quiz_review_allowed = Column(Boolean, default=False, nullable=False)
    __table_args__ = (
    UniqueConstraint("user_id", "module_type"),
)

# Manage authenticated sessions with expiration timestamps and CSRF protection.
class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(String(255), unique=True, nullable=False)
    expires_at=Column(DateTime(timezone=True), nullable=False)
    csrf_token = Column(String(64), nullable=False)

# Record which privacy policy version each volunteer has acknowledged and when. 
class PrivacyAcknowledgment(Base):
    __tablename__ = "privacy_acknowledgments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_version = Column(String, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=False)
    
    __table_args__ = (
        UniqueConstraint("user_id", "policy_version"),
    )



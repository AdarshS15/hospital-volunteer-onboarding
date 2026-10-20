from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, UniqueConstraint, DateTime
from database_creation import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    last_activity = Column(DateTime(timezone=True), nullable=True)
    training_seconds = Column(Integer, nullable=False, default=0)
    
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

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

class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(String(255), unique=True, nullable=False)
    expires_at=Column(DateTime(timezone=True), nullable=False)
    csrf_token = Column(String(64), nullable=False)
    




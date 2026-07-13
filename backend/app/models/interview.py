import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class InterviewType(str, enum.Enum):
    DSA = "DSA"
    DBMS = "DBMS"
    OS = "Operating Systems"
    CN = "Computer Networks"
    OOPS = "OOPs"


class Difficulty(str, enum.Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


class InterviewStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    interview_type = Column(Enum(InterviewType), nullable=False)
    difficulty = Column(Enum(Difficulty), nullable=False)
    # String instead of Enum — supports all 245+ companies without migrations
    company_mode = Column(String, default="Generic")
    status = Column(Enum(InterviewStatus), default=InterviewStatus.IN_PROGRESS)
    overall_score = Column(Float, nullable=True)
    total_questions = Column(Integer, default=0)
    running_summary = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan")
    coding_submissions = relationship("CodingSubmission", back_populates="interview", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Interview id={self.id} type={self.interview_type} status={self.status}>"

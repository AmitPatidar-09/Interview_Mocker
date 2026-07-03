from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    problem_title = Column(String, nullable=False)
    problem_statement = Column(Text, nullable=False)
    language = Column(String, nullable=False)
    code = Column(Text, nullable=False)

    # Judge0 results
    judge0_status = Column(String, nullable=True)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    compile_output = Column(Text, nullable=True)
    time_used = Column(Float, nullable=True)       # seconds
    memory_used = Column(Float, nullable=True)     # KB
    passed_cases = Column(Integer, default=0)
    total_cases = Column(Integer, default=0)

    # AI Review
    correctness_score = Column(Float, nullable=True)    # 0-10
    time_complexity = Column(String, nullable=True)
    space_complexity = Column(String, nullable=True)
    code_strengths = Column(JSON, default=list)
    code_weaknesses = Column(JSON, default=list)
    optimization_suggestions = Column(JSON, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    interview = relationship("Interview", back_populates="coding_submissions")

    def __repr__(self):
        return f"<CodingSubmission id={self.id} interview_id={self.interview_id}>"

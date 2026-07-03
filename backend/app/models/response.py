from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    answer_text = Column(Text, nullable=False)
    score = Column(Float, nullable=True)            # 0-10
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    ideal_answer = Column(Text, nullable=True)
    follow_up_question = Column(Text, nullable=True)
    ai_model_used = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    question = relationship("Question", back_populates="response")

    def __repr__(self):
        return f"<Response id={self.id} question_id={self.question_id} score={self.score}>"

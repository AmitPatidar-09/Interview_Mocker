from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    total_interviews = Column(Integer, default=0)
    total_questions_answered = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)

    # Topic-wise average scores  — {topic: avg_score}
    topic_scores = Column(JSON, default=dict)

    # Weak areas (topics with score < 5)
    weak_areas = Column(JSON, default=list)

    # Strong areas (topics with score >= 7)
    strong_areas = Column(JSON, default=list)

    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="analytics")

    def __repr__(self):
        return f"<Analytics user_id={self.user_id} avg_score={self.average_score}>"

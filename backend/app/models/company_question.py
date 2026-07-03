from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from ..database import Base


class CompanyQuestion(Base):
    """LeetCode problems tagged per company, seeded from the company-wise CSV dataset."""
    __tablename__ = "company_questions"

    id             = Column(Integer, primary_key=True, index=True)
    company        = Column(String, index=True, nullable=False)   # e.g. "Google"
    title          = Column(String, nullable=False)               # e.g. "Two Sum"
    difficulty     = Column(String, nullable=False)               # EASY | MEDIUM | HARD
    frequency      = Column(Float,  nullable=True)                # 0–100 relative frequency
    acceptance_rate= Column(Float,  nullable=True)                # 0–1
    leetcode_url   = Column(String, nullable=False)               # direct LeetCode link
    topics         = Column(Text,   nullable=True)                # comma-separated topics
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<CompanyQuestion company={self.company!r} title={self.title!r}>"

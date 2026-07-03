from sqlalchemy import Column, Integer, String, Text
from ..database import Base

class QuestionBank(Base):
    __tablename__ = "question_bank"

    id = Column(Integer, primary_key=True, index=True)
    interview_type = Column(String, index=True)
    difficulty = Column(String, index=True)
    company_mode = Column(String, index=True)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=True)
    ideal_answer = Column(Text, nullable=True)

    def __repr__(self):
        return f"<QuestionBank id={self.id} type={self.interview_type} diff={self.difficulty}>"

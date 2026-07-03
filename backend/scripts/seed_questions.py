import asyncio
import os
import sys

# Add backend dir to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.question_bank import QuestionBank
from app.models.interview import InterviewType, Difficulty, CompanyMode
from app.services.ai_service import generate_json
from app.prompts.templates import question_generation_prompt

async def generate_and_seed(db, interview_type, difficulty, company_mode, count=5):
    print(f"Generating {count} questions for {interview_type} - {difficulty} - {company_mode}")
    
    for i in range(count):
        # We pass previous_questions as empty to keep them distinct but general
        prompt = question_generation_prompt(
            interview_type=interview_type.value,
            difficulty=difficulty.value,
            company_mode=company_mode.value,
            previous_questions=[]
        )
        try:
            # Generate using Ollama
            data = await generate_json(prompt)
            
            qb = QuestionBank(
                interview_type=interview_type.value,
                difficulty=difficulty.value,
                company_mode=company_mode.value,
                content=data["question"],
                category=data.get("category"),
                ideal_answer="Pre-generated ideal answer placeholder"
            )
            db.add(qb)
            db.commit()
            print(f"  + Added: {data['question'][:50]}...")
        except Exception as e:
            print(f"  - Error generating: {e}")

async def main():
    db = SessionLocal()
    try:
        # Example: generate just a few for testing
        types = [InterviewType.DSA, InterviewType.DBMS]
        difficulties = [Difficulty.EASY, Difficulty.MEDIUM]
        companies = [CompanyMode.GENERIC, CompanyMode.AMAZON]
        
        for t in types:
            for d in difficulties:
                for c in companies:
                    await generate_and_seed(db, t, d, c, count=2)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())

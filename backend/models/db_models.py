from sqlalchemy import Column, Integer, String, Float, JSON, DateTime
from datetime import datetime
from database import Base

class CandidateRecord(Base):
    __tablename__ = "candidate_records"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String(50), index=True, nullable=False)
    composite_score = Column(Float, nullable=False)
    bias_verdict = Column(String(50), nullable=False)
    skills = Column(JSON, nullable=True)
    full_analysis = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

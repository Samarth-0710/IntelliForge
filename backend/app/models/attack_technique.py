from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.database.base import Base


class AttackTechnique(Base):
    __tablename__ = "attack_techniques"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    tactic = Column(String(100), nullable=False)  # e.g., Credential Access, Defense Evasion
    technique_id = Column(String(50), nullable=False, index=True)  # e.g., T1110, T1070
    technique_name = Column(String(200), nullable=False)  # e.g., Brute Force, Indicator Removal
    confidence = Column(Integer, default=90)  # 0-100
    evidence = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow)

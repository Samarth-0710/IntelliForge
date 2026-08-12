from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.database.base import Base


class ThreatIntelligence(Base):
    __tablename__ = "threat_intelligence"

    id = Column(Integer, primary_key=True, index=True)
    indicator = Column(String(200), index=True, nullable=False)
    indicator_type = Column(String(50), default="ip")  # ip, domain, url, hash
    query = Column(String(500), nullable=True)
    verdict = Column(String(50), default="Unknown")  # Known Malicious, Suspicious, Unknown, No Evidence
    confidence = Column(Integer, default=50)  # 0-100
    summary = Column(Text, nullable=True)
    sources = Column(Text, nullable=True)  # JSON array string of citations
    raw_data = Column(Text, nullable=True)
    last_checked = Column(DateTime, default=datetime.utcnow, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)

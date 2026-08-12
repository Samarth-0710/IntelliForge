from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.database.base import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)

    description = Column(String)

    severity = Column(String(20), nullable=False)

    source_ip = Column(String(50))

    status = Column(String(20), default="Open")

    created_at = Column(DateTime, default=datetime.utcnow)

    resolved_at = Column(DateTime, nullable=True)

    assigned_to = Column(String(100), nullable=True)

    # IntelliForge 2.0 Enhanced Fields (Optional / Backward Compatible)
    risk_score = Column(Integer, default=0)
    confidence = Column(Integer, default=85)
    endpoint_id = Column(String(100), nullable=True)
    correlation_id = Column(String(100), nullable=True)
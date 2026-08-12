from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.database.base import Base


class IncidentCorrelation(Base):
    __tablename__ = "incident_correlations"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    correlation_id = Column(String(100), unique=True, index=True, nullable=False)
    rule_name = Column(String(200), nullable=False)
    event_count = Column(Integer, default=1)
    affected_users = Column(Text, nullable=True)  # JSON or comma-separated list
    affected_endpoints = Column(Text, nullable=True)  # JSON or comma-separated list
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, default=datetime.utcnow)
    duration_seconds = Column(Integer, default=0)
    confidence = Column(Integer, default=90)
    attack_pattern = Column(String(200), nullable=True)


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("security_events.id", ondelete="CASCADE"), nullable=True)
    log_id = Column(Integer, ForeignKey("logs.id", ondelete="CASCADE"), nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)

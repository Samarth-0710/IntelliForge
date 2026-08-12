from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    actor = Column(String(100), default="System", index=True)
    action = Column(String(100), nullable=False, index=True)
    target_type = Column(String(50), nullable=True)  # incident, log, endpoint, security_event, system
    target_id = Column(String(100), nullable=True)
    result = Column(String(50), default="SUCCESS")  # SUCCESS, FAILURE, WARNING
    details = Column(Text, nullable=True)

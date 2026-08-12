from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from app.database.base import Base


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    endpoint_id = Column(String(100), index=True, nullable=True)
    hostname = Column(String(100), nullable=True, index=True)
    source = Column(String(100), nullable=False)  # "Windows Security Log", "Syslog", etc.
    event_type = Column(String(100), nullable=False)  # "Failed Logon", "Process Creation", etc.
    event_id = Column(Integer, nullable=True, index=True)  # 4625, 4624, 4688, 1102, etc.
    username = Column(String(100), nullable=True, index=True)
    source_ip = Column(String(50), nullable=True, index=True)
    destination_ip = Column(String(50), nullable=True)
    workstation = Column(String(100), nullable=True)
    category = Column(String(50), default="Authentication")
    severity = Column(String(20), default="Low")
    risk_score = Column(Integer, default=0)
    status = Column(String(20), default="Processed")
    raw_metadata = Column(Text, nullable=True)
    normalized_metadata = Column(Text, nullable=True)
    is_simulation = Column(Boolean, default=False)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)

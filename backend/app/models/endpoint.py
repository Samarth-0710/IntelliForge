from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database.base import Base


class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True, index=True)
    endpoint_id = Column(String(100), unique=True, index=True, nullable=False)
    hostname = Column(String(100), nullable=False, index=True)
    operating_system = Column(String(100), default="Windows 11")
    platform = Column(String(50), default="windows")  # windows, darwin, linux
    ip_address = Column(String(50), nullable=True)
    tailscale_ip = Column(String(50), nullable=True)
    status = Column(String(20), default="Online")  # Online, Offline, Degraded
    last_seen = Column(DateTime, default=datetime.utcnow, index=True)
    collector_version = Column(String(50), default="2.0.0")
    risk_level = Column(String(20), default="Low")  # Low, Medium, High, Critical
    event_count = Column(Integer, default=0)
    incident_count = Column(Integer, default=0)
    registered_at = Column(DateTime, default=datetime.utcnow)

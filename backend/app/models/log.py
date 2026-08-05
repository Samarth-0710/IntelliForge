from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime
from app.database.base import Base


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)

    timestamp = Column(DateTime, default=datetime.utcnow)

    source = Column(String(50), nullable=False)

    username = Column(String(100))

    ip_address = Column(String(50))

    event_type = Column(String(100), nullable=False)

    severity = Column(String(20), default="Low")

    status = Column(String(20), default="New")

    risk_score = Column(Integer, default=0)

    ai_summary = Column(String)
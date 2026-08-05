from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Boolean

from app.database.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(100), nullable=False)

    message = Column(String, nullable=False)

    severity = Column(String(20))

    is_read = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
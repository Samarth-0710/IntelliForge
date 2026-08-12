from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.database.base import Base


class AutomationRun(Base):
    __tablename__ = "automation_runs"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    workflow_name = Column(String(200), default="n8n SOC Security Automation")
    trigger_type = Column(String(50), default="webhook")  # webhook, manual, auto_escalate
    status = Column(String(50), default="Triggered")  # Triggered, Success, Failed, Skipped
    payload_sent = Column(Text, nullable=True)
    response_payload = Column(Text, nullable=True)
    triggered_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)

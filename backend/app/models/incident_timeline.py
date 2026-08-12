from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.database.base import Base


class IncidentTimeline(Base):
    __tablename__ = "incident_timeline"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    stage = Column(String(100), nullable=False)  # Detection, Risk Calculation, AI Investigation, Threat Intelligence, Correlation, MITRE Mapping, Automation, Alert Dispatch, Analyst Action, Resolution
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    actor = Column(String(100), default="System")  # System, Windows Collector, Risk Engine, AI SOC Analyst, Tavily, Lyzr, n8n, Analyst
    status = Column(String(50), default="Success")  # Success, Warning, Error, Info
    metadata_json = Column(Text, nullable=True)

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from app.database.base import Base


class SOARAction(Base):
    __tablename__ = "soar_actions"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String(100), nullable=False)  # notify_analyst, assign_incident, escalate_severity, block_ip, disable_account, isolate_endpoint, kill_process
    target = Column(String(200), nullable=True)  # IP address, Username, Endpoint hostname, Process ID
    is_destructive = Column(Boolean, default=False)  # True for block_ip, disable_account, etc. (requires human approval)
    status = Column(String(50), default="Proposed")  # Proposed, Approved, Rejected, Executed, Failed
    proposed_by = Column(String(100), default="AI SOC Analyst")
    approved_by = Column(String(100), nullable=True)
    reason = Column(Text, nullable=True)
    execution_result = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    executed_at = Column(DateTime, nullable=True)

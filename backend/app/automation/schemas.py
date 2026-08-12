from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class AutomationRunResponse(BaseModel):
    id: int
    incident_id: int
    workflow_name: str
    trigger_type: str
    status: str
    triggered_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SOARActionPropose(BaseModel):
    incident_id: int
    action_type: str  # notify_analyst, assign_incident, escalate_severity, block_ip, disable_account, isolate_endpoint, kill_process
    target: Optional[str] = None
    reason: Optional[str] = None


class SOARActionResponse(BaseModel):
    id: int
    incident_id: int
    action_type: str
    target: Optional[str] = None
    is_destructive: bool
    status: str  # Proposed, Approved, Rejected, Executed, Failed
    proposed_by: str
    approved_by: Optional[str] = None
    reason: Optional[str] = None
    execution_result: Optional[str] = None
    created_at: datetime
    executed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

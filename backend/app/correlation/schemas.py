from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class IncidentCorrelationResponse(BaseModel):
    id: int
    incident_id: int
    correlation_id: str
    rule_name: str
    event_count: int
    affected_users: Optional[str] = None
    affected_endpoints: Optional[str] = None
    start_time: datetime
    end_time: datetime
    duration_seconds: int
    confidence: int
    attack_pattern: Optional[str] = None

    class Config:
        from_attributes = True

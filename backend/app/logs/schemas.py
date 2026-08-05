from datetime import datetime
from pydantic import BaseModel


class LogCreate(BaseModel):
    source: str
    username: str
    ip_address: str
    event_type: str
    severity: str


class LogResponse(BaseModel):
    id: int
    timestamp: datetime
    source: str
    username: str
    ip_address: str
    event_type: str
    severity: str
    status: str
    risk_score: int
    ai_summary: str | None = None

    class Config:
        from_attributes = True
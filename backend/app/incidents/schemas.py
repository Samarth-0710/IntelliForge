from datetime import datetime
from pydantic import BaseModel


class IncidentCreate(BaseModel):
    title: str
    description: str
    severity: str
    source_ip: str


class IncidentResponse(BaseModel):
    id: int
    title: str
    description: str
    severity: str
    source_ip: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentAssign(BaseModel):
    assigned_to: str
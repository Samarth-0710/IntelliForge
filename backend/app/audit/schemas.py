from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    actor: str
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    result: str
    details: Optional[str] = None

    class Config:
        from_attributes = True

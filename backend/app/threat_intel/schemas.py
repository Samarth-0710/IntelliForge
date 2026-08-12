from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ThreatIntelRequest(BaseModel):
    indicator: str
    indicator_type: Optional[str] = "ip"  # ip, domain, url, hash


class ThreatIntelResponse(BaseModel):
    id: Optional[int] = None
    indicator: str
    indicator_type: str
    verdict: str  # Known Malicious, Suspicious, Unknown, No Evidence
    confidence: int
    summary: str
    sources: List[str] = []
    last_checked: datetime
    query: Optional[str] = None
    incident_id: Optional[int] = None

    class Config:
        from_attributes = True

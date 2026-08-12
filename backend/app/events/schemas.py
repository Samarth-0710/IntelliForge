from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class EventIngestRequest(BaseModel):
    source: str = "Windows Security Log"
    endpoint_id: Optional[str] = None
    hostname: Optional[str] = None
    event_type: Optional[str] = "Security Event"
    event_id: Optional[int] = None
    username: Optional[str] = None
    ip_address: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    workstation: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = "Low"
    raw_metadata: Optional[Dict[str, Any]] = None
    tailscale_ip: Optional[str] = None
    is_simulation: Optional[bool] = False


class SecurityEventResponse(BaseModel):
    id: int
    timestamp: datetime
    endpoint_id: Optional[str] = None
    hostname: Optional[str] = None
    source: str
    event_type: str
    event_id: Optional[int] = None
    username: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    workstation: Optional[str] = None
    category: Optional[str] = None
    severity: str
    risk_score: int
    status: str
    raw_metadata: Optional[str] = None
    normalized_metadata: Optional[str] = None
    is_simulation: bool
    incident_id: Optional[int] = None

    class Config:
        from_attributes = True


class LiveEventFeedItem(BaseModel):
    id: int
    timestamp: datetime
    severity: str
    event_id: Optional[int] = None
    event_type: str
    hostname: Optional[str] = None
    endpoint_id: Optional[str] = None
    username: Optional[str] = None
    source_ip: Optional[str] = None
    risk_score: int
    is_simulation: bool
    description: str


class LiveEventFeedResponse(BaseModel):
    total_events: int
    events_per_minute: float
    high_critical_count: int
    events: List[LiveEventFeedItem]

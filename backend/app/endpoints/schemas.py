from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class EndpointRegister(BaseModel):
    endpoint_id: str
    hostname: str
    operating_system: Optional[str] = "Windows 11"
    platform: Optional[str] = "windows"
    ip_address: Optional[str] = None
    tailscale_ip: Optional[str] = None
    collector_version: Optional[str] = "2.0.0"


class EndpointHeartbeat(BaseModel):
    endpoint_id: str
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    tailscale_ip: Optional[str] = None
    status: Optional[str] = "Online"
    collector_version: Optional[str] = None


class EndpointResponse(BaseModel):
    id: int
    endpoint_id: str
    hostname: str
    operating_system: str
    platform: str
    ip_address: Optional[str] = None
    tailscale_ip: Optional[str] = None
    status: str
    last_seen: datetime
    collector_version: str
    risk_level: str
    event_count: int
    incident_count: int
    registered_at: datetime

    class Config:
        from_attributes = True


class EndpointSummary(BaseModel):
    total_endpoints: int
    online_endpoints: int
    offline_endpoints: int
    high_risk_endpoints: int
    endpoints: List[EndpointResponse]

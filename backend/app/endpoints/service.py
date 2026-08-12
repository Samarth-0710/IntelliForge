from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.endpoint import Endpoint
from app.models.incident import Incident
from app.models.security_event import SecurityEvent
from app.endpoints.schemas import EndpointRegister, EndpointHeartbeat
from app.services.audit_service import log_audit


def register_or_update_endpoint(
    db: Session,
    data: EndpointRegister
) -> Endpoint:
    endpoint = (
        db.query(Endpoint)
        .filter(Endpoint.endpoint_id == data.endpoint_id)
        .first()
    )

    if not endpoint:
        endpoint = Endpoint(
            endpoint_id=data.endpoint_id,
            hostname=data.hostname,
            operating_system=data.operating_system or "Windows 11",
            platform=data.platform or "windows",
            ip_address=data.ip_address,
            tailscale_ip=data.tailscale_ip,
            status="Online",
            last_seen=datetime.utcnow(),
            collector_version=data.collector_version or "2.0.0",
            risk_level="Low",
            event_count=0,
            incident_count=0,
        )
        db.add(endpoint)
        db.commit()
        db.refresh(endpoint)
        log_audit(
            db=db,
            action="ENDPOINT_REGISTERED",
            actor=f"Endpoint:{data.hostname}",
            target_type="endpoint",
            target_id=str(endpoint.endpoint_id),
            details={"hostname": data.hostname, "ip": data.ip_address, "os": data.operating_system},
        )
    else:
        endpoint.hostname = data.hostname
        if data.operating_system:
            endpoint.operating_system = data.operating_system
        if data.platform:
            endpoint.platform = data.platform
        if data.ip_address:
            endpoint.ip_address = data.ip_address
        if data.tailscale_ip:
            endpoint.tailscale_ip = data.tailscale_ip
        if data.collector_version:
            endpoint.collector_version = data.collector_version
        endpoint.status = "Online"
        endpoint.last_seen = datetime.utcnow()
        db.commit()
        db.refresh(endpoint)

    return endpoint


def process_heartbeat(
    db: Session,
    data: EndpointHeartbeat
) -> Endpoint:
    endpoint = (
        db.query(Endpoint)
        .filter(Endpoint.endpoint_id == data.endpoint_id)
        .first()
    )

    if not endpoint:
        # Auto-provision if heartbeat arrives from new collector
        endpoint = Endpoint(
            endpoint_id=data.endpoint_id,
            hostname=data.hostname or data.endpoint_id,
            ip_address=data.ip_address,
            tailscale_ip=data.tailscale_ip,
            status="Online",
            last_seen=datetime.utcnow(),
            collector_version=data.collector_version or "2.0.0",
            risk_level="Low",
        )
        db.add(endpoint)
    else:
        if data.hostname:
            endpoint.hostname = data.hostname
        if data.ip_address:
            endpoint.ip_address = data.ip_address
        if data.tailscale_ip:
            endpoint.tailscale_ip = data.tailscale_ip
        if data.collector_version:
            endpoint.collector_version = data.collector_version
        endpoint.status = data.status or "Online"
        endpoint.last_seen = datetime.utcnow()

    db.commit()
    db.refresh(endpoint)
    return endpoint


def get_all_endpoints(db: Session) -> List[Endpoint]:
    # Update offline statuses if last_seen > 10 minutes ago
    cutoff = datetime.utcnow() - timedelta(minutes=10)
    stale_endpoints = (
        db.query(Endpoint)
        .filter(Endpoint.last_seen < cutoff, Endpoint.status == "Online")
        .all()
    )
    for ep in stale_endpoints:
        ep.status = "Offline"
    if stale_endpoints:
        db.commit()

    return db.query(Endpoint).order_by(Endpoint.last_seen.desc()).all()


def get_endpoint_by_id(db: Session, endpoint_id: str) -> Endpoint:
    endpoint = (
        db.query(Endpoint)
        .filter((Endpoint.endpoint_id == endpoint_id) | (Endpoint.hostname == endpoint_id))
        .first()
    )
    if not endpoint:
        raise HTTPException(status_code=404, detail=f"Endpoint '{endpoint_id}' not found")
    return endpoint


def increment_endpoint_counters(
    db: Session,
    endpoint_identifier: str,
    events_delta: int = 1,
    incidents_delta: int = 0,
    new_risk_level: Optional[str] = None
):
    if not endpoint_identifier:
        return
    endpoint = (
        db.query(Endpoint)
        .filter((Endpoint.endpoint_id == endpoint_identifier) | (Endpoint.hostname == endpoint_identifier))
        .first()
    )
    if endpoint:
        endpoint.event_count = (endpoint.event_count or 0) + events_delta
        if incidents_delta:
            endpoint.incident_count = (endpoint.incident_count or 0) + incidents_delta
        if new_risk_level:
            # Upgrade risk level if higher
            level_weights = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
            current_weight = level_weights.get(endpoint.risk_level, 1)
            new_weight = level_weights.get(new_risk_level, 1)
            if new_weight > current_weight:
                endpoint.risk_level = new_risk_level
        endpoint.last_seen = datetime.utcnow()
        endpoint.status = "Online"
        db.commit()

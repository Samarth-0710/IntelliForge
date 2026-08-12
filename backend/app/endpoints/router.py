from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.endpoints.schemas import (
    EndpointRegister,
    EndpointHeartbeat,
    EndpointResponse,
    EndpointSummary,
)
from app.endpoints.service import (
    register_or_update_endpoint,
    process_heartbeat,
    get_all_endpoints,
    get_endpoint_by_id,
)

router = APIRouter(
    prefix="/endpoints",
    tags=["Endpoints"]
)


@router.get("/", response_model=List[EndpointResponse])
def list_endpoints(db: Session = Depends(get_db)):
    return get_all_endpoints(db)


@router.get("/summary", response_model=EndpointSummary)
def get_endpoints_summary(db: Session = Depends(get_db)):
    endpoints = get_all_endpoints(db)
    total = len(endpoints)
    online = sum(1 for ep in endpoints if ep.status == "Online")
    offline = total - online
    high_risk = sum(1 for ep in endpoints if ep.risk_level in ["High", "Critical"])
    return {
        "total_endpoints": total,
        "online_endpoints": online,
        "offline_endpoints": offline,
        "high_risk_endpoints": high_risk,
        "endpoints": endpoints,
    }


@router.post("/register", response_model=EndpointResponse)
def register_endpoint(
    data: EndpointRegister,
    db: Session = Depends(get_db)
):
    return register_or_update_endpoint(db, data)


@router.post("/heartbeat", response_model=EndpointResponse)
def heartbeat_endpoint(
    data: EndpointHeartbeat,
    db: Session = Depends(get_db)
):
    return process_heartbeat(db, data)


@router.get("/{endpoint_id}", response_model=EndpointResponse)
def endpoint_detail(
    endpoint_id: str,
    db: Session = Depends(get_db)
):
    return get_endpoint_by_id(db, endpoint_id)

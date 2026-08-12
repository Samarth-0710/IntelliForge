from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.security_event import SecurityEvent
from app.events.schemas import (
    EventIngestRequest,
    SecurityEventResponse,
    LiveEventFeedResponse,
)
from app.events.service import ingest_security_event, get_live_events

router = APIRouter(
    prefix="/events",
    tags=["Security Events"]
)


@router.post("/ingest")
def ingest_event(
    payload: EventIngestRequest,
    db: Session = Depends(get_db)
):
    return ingest_security_event(db, payload.model_dump())


@router.get("/", response_model=List[SecurityEventResponse])
def list_events(
    limit: int = 100,
    severity: str = None,
    hostname: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(SecurityEvent).order_by(SecurityEvent.timestamp.desc())
    if severity:
        query = query.filter(SecurityEvent.severity == severity.capitalize())
    if hostname:
        query = query.filter(SecurityEvent.hostname == hostname)
    return query.limit(limit).all()


@router.get("/live", response_model=LiveEventFeedResponse)
def live_event_feed(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    return get_live_events(db, limit=limit)


@router.get("/{event_id}", response_model=SecurityEventResponse)
def get_event_detail(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Security Event not found")
    return event

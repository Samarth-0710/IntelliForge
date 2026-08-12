from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.session import get_db
from app.auth.dependencies import get_current_user

from app.incidents.schemas import (
    IncidentCreate,
    IncidentAssign,
)

from app.incidents.service import (
    create_incident,
    get_incidents,
    resolve_incident,
    assign_incident,
    get_incident_by_id,
    get_incident_timeline,
    get_incident_security_events,
    get_incident_threat_intelligence,
    get_incident_attack_techniques,
    escalate_incident,
)
from app.ai.soc_analyst import generate_soc_analyst_investigation


class EscalateRequest(BaseModel):
    reason: str = "Escalated by SOC Analyst"


router = APIRouter(
    prefix="/incidents",
    tags=["Incidents"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/")
def create(
    incident: IncidentCreate,
    db: Session = Depends(get_db)
):
    return create_incident(
        db,
        incident
    )


@router.get("/")
def list_incidents(
    page: int = 1,
    limit: int = 100,
    status: str | None = None,
    severity: str | None = None,
    db: Session = Depends(get_db)
):
    return get_incidents(
        db,
        page,
        limit,
        status,
        severity
    )


@router.get("/{incident_id}")
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    return get_incident_by_id(
        db,
        incident_id
    )


@router.get("/{incident_id}/timeline")
def get_timeline(
    incident_id: int,
    db: Session = Depends(get_db)
):
    return get_incident_timeline(db, incident_id)


@router.get("/{incident_id}/events")
def get_events(
    incident_id: int,
    db: Session = Depends(get_db)
):
    return get_incident_security_events(db, incident_id)


@router.get("/{incident_id}/intelligence")
def get_intelligence(
    incident_id: int,
    db: Session = Depends(get_db)
):
    return get_incident_threat_intelligence(db, incident_id)


@router.get("/{incident_id}/attack-techniques")
def get_attack_techniques(
    incident_id: int,
    db: Session = Depends(get_db)
):
    return get_incident_attack_techniques(db, incident_id)


@router.get("/{incident_id}/ai-analysis")
def get_ai_analysis(
    incident_id: int,
    db: Session = Depends(get_db)
):
    return generate_soc_analyst_investigation(db, incident_id)


@router.post("/{incident_id}/investigate")
def trigger_investigate(
    incident_id: int,
    db: Session = Depends(get_db)
):
    return generate_soc_analyst_investigation(db, incident_id)


@router.post("/{incident_id}/escalate")
def escalate(
    incident_id: int,
    data: EscalateRequest = None,
    db: Session = Depends(get_db)
):
    reason = data.reason if data else "Escalated by SOC Analyst"
    return escalate_incident(db, incident_id, reason=reason)


@router.patch("/{incident_id}/resolve")
def resolve(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = resolve_incident(
        db,
        incident_id
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return incident


@router.patch("/{incident_id}/assign")
def assign(
    incident_id: int,
    data: IncidentAssign,
    db: Session = Depends(get_db)
):
    incident = assign_incident(
        db,
        incident_id,
        data.assigned_to
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return incident
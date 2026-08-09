from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User

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
)

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
    return create_incident(db, incident)

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

@router.patch("/{incident_id}/resolve")
def resolve(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = resolve_incident(db, incident_id)

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
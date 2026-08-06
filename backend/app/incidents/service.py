from datetime import datetime
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.incidents.schemas import IncidentCreate
from app.notifications.service import create_notification
from fastapi import HTTPException

def create_incident(db: Session, incident: IncidentCreate):

    new_incident = Incident(
        title=incident.title,
        description=incident.description,
        severity=incident.severity,
        source_ip=incident.source_ip
    )

    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    # Create an in-app notification
    create_notification(
        db=db,
        title="🚨 Security Incident Detected",
        message=f"{new_incident.title} from {new_incident.source_ip}",
        severity=new_incident.severity
    )

    return new_incident


def get_incidents(
    db: Session,
    page: int = 1,
    limit: int = 10,
    status: str = None,
    severity: str = None
):

    query = db.query(Incident)

    if status:
        query = query.filter(
            Incident.status == status.strip()
        )

    if severity:
        query = query.filter(
            Incident.severity == severity.strip()
        )

    query = query.offset((page - 1) * limit).limit(limit)

    return query.all()


def create_incident_from_log(db: Session, log):

    incident = Incident(
        title=f"{log.event_type} Detected",
        description=f"AI detected a high-risk event from {log.source}",
        severity=log.severity,
        source_ip=log.ip_address,
        status="Open"
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Create an in-app notification
    create_notification(
        db=db,
        title="🚨 AI Security Alert",
        message=f"{incident.title} from {incident.source_ip}",
        severity=incident.severity
    )

    return incident


def resolve_incident(db: Session, incident_id: int):

    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if incident is None:
        return None

    incident.status = "Resolved"
    incident.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(incident)

    return incident


def assign_incident(
    db: Session,
    incident_id: int,
    assigned_to: str
):

    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if incident is None:
        return None

    incident.assigned_to = assigned_to

    db.commit()
    db.refresh(incident)

    return incident

def get_incident_by_id(
    db: Session,
    incident_id: int
):
    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return incident
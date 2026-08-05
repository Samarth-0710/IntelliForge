from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.incidents.schemas import IncidentCreate


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

    return incident

from datetime import datetime

def resolve_incident(db: Session, incident_id: int):

    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if not incident:
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
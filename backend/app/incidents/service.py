from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.incident import Incident
from app.incidents.schemas import IncidentCreate
from app.notifications.service import create_notification
from app.notifications.email_service import send_email_alert


# ============================================================
# SEND INCIDENT EMAIL
# ============================================================

def send_incident_email(incident):
    try:
        send_email_alert(incident)
        print(
            f"[EMAIL] Incident alert sent for Incident #{incident.id}"
        )

    except Exception as e:
        # Email failure must NOT break incident creation
        print(
            f"[EMAIL] Failed to send incident alert "
            f"for Incident #{incident.id}: {e}"
        )


# ============================================================
# SEND INCIDENT RESOLVED EMAIL
# ============================================================

def send_incident_resolved_email(incident):
    try:
        send_email_alert(incident)
        print(
            f"[EMAIL] Resolution alert sent "
            f"for Incident #{incident.id}"
        )

    except Exception as e:
        # Email failure must NOT break incident resolution
        print(
            f"[EMAIL] Failed to send resolution alert "
            f"for Incident #{incident.id}: {e}"
        )


# ============================================================
# CREATE INCIDENT
# ============================================================

def create_incident(
    db: Session,
    incident: IncidentCreate
):
    new_incident = Incident(
        title=incident.title,
        description=incident.description,
        severity=incident.severity,
        source_ip=incident.source_ip,
        status="Open"
    )

    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    # Create an in-app notification
    create_notification(
        db=db,
        title="🚨 Security Incident Detected",
        message=(
            f"{new_incident.title} from "
            f"{new_incident.source_ip} "
            f"(Incident #{new_incident.id})"
        ),
        severity=new_incident.severity
    )

    # Send email alert
    send_incident_email(new_incident)

    return new_incident


# ============================================================
# GET INCIDENTS
# ============================================================

def get_incidents(
    db: Session,
    page: int = 1,
    limit: int = 100,
    status: str = None,
    severity: str = None
):
    query = (
        db.query(Incident)
        .order_by(Incident.created_at.desc())
    )

    if status:
        query = query.filter(
            Incident.status == status.strip()
        )

    if severity:
        query = query.filter(
            Incident.severity == severity.strip()
        )

    if limit and limit > 0:
        query = (
            query
            .offset((page - 1) * limit)
            .limit(limit)
        )

    return query.all()


# ============================================================
# CREATE INCIDENT FROM AI LOG
# ============================================================

def create_incident_from_log(
    db: Session,
    log
):
    event_type = log.event_type or "Security Event"

    # Avoid duplicate "Detected Detected"
    if event_type.lower().endswith("detected"):
        incident_title = event_type
    else:
        incident_title = f"{event_type} Detected"

    incident = Incident(
        title=incident_title,
        description=(
            f"AI detected a high-risk event "
            f"from {log.source}"
        ),
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
        message=(
            f"{incident.title} from "
            f"{incident.source_ip} "
            f"(Incident #{incident.id})"
        ),
        severity=incident.severity
    )

    # Send email alert
    send_incident_email(incident)

    return incident


# ============================================================
# RESOLVE INCIDENT
# ============================================================

def resolve_incident(
    db: Session,
    incident_id: int
):
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

    # Create in-app notification
    create_notification(
        db=db,
        title="✅ Incident Resolved",
        message=(
            f"{incident.title} "
            f"(Incident #{incident.id}) "
            f"has been resolved."
        ),
        severity=incident.severity
    )

    # Send resolution email
    send_incident_resolved_email(incident)

    return incident


# ============================================================
# ASSIGN INCIDENT
# ============================================================

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

    incident.assigned_to = (
        assigned_to.strip()
        if assigned_to
        else None
    )

    db.commit()
    db.refresh(incident)

    return incident


# ============================================================
# GET INCIDENT BY ID
# ============================================================

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
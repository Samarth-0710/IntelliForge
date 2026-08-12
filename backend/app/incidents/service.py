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
        send_email_alert(
            incident=incident,
            notification_type="created"
        )

        print(
            f"[EMAIL] Incident alert sent for "
            f"Incident #{incident.id}"
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
        send_email_alert(
            incident=incident,
            notification_type="resolved"
        )

        print(
            f"[EMAIL] Resolution alert sent for "
            f"Incident #{incident.id}"
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

    # Send email to ALL team members
    # This happens for EVERY severity:
    # Low / Medium / High / Critical
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

    # Send email to ALL team members
    # No severity restriction
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

    # Send resolution email to ALL team members
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


# ============================================================
# GET INCIDENT TIMELINE
# ============================================================

def get_incident_timeline(
    db: Session,
    incident_id: int
):
    from app.models.incident_timeline import IncidentTimeline

    timeline_entries = (
        db.query(IncidentTimeline)
        .filter(IncidentTimeline.incident_id == incident_id)
        .order_by(IncidentTimeline.timestamp.asc())
        .all()
    )

    if not timeline_entries:
        # Generate baseline timeline if none exists yet
        incident = get_incident_by_id(db, incident_id)
        entries = [
            IncidentTimeline(
                incident_id=incident.id,
                stage="Detection",
                title="Security Event Ingested",
                description=f"Initial event telemetry captured from {incident.endpoint_id or incident.source_ip or 'endpoint'}.",
                actor="Event Ingest Pipeline",
                status="Success",
                timestamp=incident.created_at,
            ),
            IncidentTimeline(
                incident_id=incident.id,
                stage="Risk Calculation",
                title=f"Risk Score Computed ({incident.risk_score or 75}/100)",
                description=f"Multi-factor risk engine evaluated severity: {incident.severity}.",
                actor="Risk Engine",
                status="Success",
                timestamp=incident.created_at,
            ),
            IncidentTimeline(
                incident_id=incident.id,
                stage="Incident Creation",
                title=f"Incident #{incident.id} Initialized",
                description=f"Incident registered with status '{incident.status}'.",
                actor="Incident Engine",
                status="Success",
                timestamp=incident.created_at,
            ),
        ]
        db.add_all(entries)
        db.commit()
        timeline_entries = entries

    return timeline_entries


# ============================================================
# GET INCIDENT SECURITY EVENTS
# ============================================================

def get_incident_security_events(
    db: Session,
    incident_id: int
):
    from app.models.security_event import SecurityEvent
    return (
        db.query(SecurityEvent)
        .filter(SecurityEvent.incident_id == incident_id)
        .order_by(SecurityEvent.timestamp.desc())
        .all()
    )


# ============================================================
# GET INCIDENT THREAT INTELLIGENCE
# ============================================================

def get_incident_threat_intelligence(
    db: Session,
    incident_id: int
):
    from app.models.threat_intelligence import ThreatIntelligence
    from app.threat_intel.tavily_service import lookup_threat_intelligence

    incident = get_incident_by_id(db, incident_id)
    records = (
        db.query(ThreatIntelligence)
        .filter(ThreatIntelligence.incident_id == incident_id)
        .all()
    )
    if not records and incident.source_ip:
        # Perform lookup on demand
        intel = lookup_threat_intelligence(
            indicator=incident.source_ip,
            indicator_type="ip",
            db=db,
            incident_id=incident.id
        )
        records = (
            db.query(ThreatIntelligence)
            .filter(ThreatIntelligence.incident_id == incident_id)
            .all()
        )
    return records


# ============================================================
# GET INCIDENT ATTACK TECHNIQUES
# ============================================================

def get_incident_attack_techniques(
    db: Session,
    incident_id: int
):
    from app.mitre.mapping_service import map_attack_techniques_for_incident
    incident = get_incident_by_id(db, incident_id)
    return map_attack_techniques_for_incident(db, incident)


# ============================================================
# ESCALATE INCIDENT
# ============================================================

def escalate_incident(
    db: Session,
    incident_id: int,
    reason: str = "Escalated by SOC Analyst"
):
    from app.models.incident_timeline import IncidentTimeline
    from app.automation.n8n_service import trigger_n8n_workflow
    from app.services.audit_service import log_audit

    incident = get_incident_by_id(db, incident_id)
    incident.severity = "Critical"
    incident.risk_score = max(incident.risk_score or 0, 95)
    db.commit()
    db.refresh(incident)

    timeline = IncidentTimeline(
        incident_id=incident.id,
        stage="Escalation",
        title="Incident Escalated to CRITICAL",
        description=f"{reason}. Immediate response protocols initiated.",
        actor="SOC Analyst",
        status="Warning",
        timestamp=datetime.utcnow(),
    )
    db.add(timeline)
    db.commit()

    trigger_n8n_workflow(db, incident, trigger_type="escalation")

    log_audit(
        db=db,
        action="INCIDENT_ESCALATED",
        actor="SOC Analyst",
        target_type="incident",
        target_id=str(incident.id),
        result="CRITICAL",
        details={"reason": reason},
    )

    return incident
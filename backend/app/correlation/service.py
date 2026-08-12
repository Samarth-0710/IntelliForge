import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.security_event import SecurityEvent
from app.models.incident_correlation import IncidentCorrelation, IncidentEvent
from app.models.incident_timeline import IncidentTimeline
from app.services.audit_service import log_audit


def correlate_event(
    db: Session,
    event: SecurityEvent
) -> Tuple[Optional[Incident], Optional[IncidentCorrelation]]:
    """
    IntelliForge 2.0 Correlation Engine.
    Correlates incoming SecurityEvent with active incidents or creates a new correlated incident.
    """
    time_window = datetime.utcnow() - timedelta(minutes=15)

    # 1. Search for existing active (Open) incident on the same host or source IP or user within window
    candidate_incident = (
        db.query(Incident)
        .filter(
            Incident.status == "Open",
            Incident.created_at >= time_window,
            (
                (Incident.source_ip == event.source_ip) if event.source_ip and event.source_ip not in ["127.0.0.1", "localhost", ""]
                else (Incident.endpoint_id == event.endpoint_id) if event.endpoint_id
                else (Incident.title.ilike(f"%{event.event_type}%"))
            )
        )
        .order_by(Incident.created_at.desc())
        .first()
    )

    if candidate_incident:
        # Check existing correlation record
        correlation = (
            db.query(IncidentCorrelation)
            .filter(IncidentCorrelation.incident_id == candidate_incident.id)
            .first()
        )
        if correlation:
            correlation.event_count += 1
            correlation.end_time = datetime.utcnow()
            diff = (correlation.end_time - correlation.start_time).total_seconds()
            correlation.duration_seconds = max(1, int(diff))

            # Update affected users
            users = set()
            if correlation.affected_users:
                try:
                    users = set(json.loads(correlation.affected_users))
                except Exception:
                    users = {correlation.affected_users}
            if event.username:
                users.add(event.username)
            correlation.affected_users = json.dumps(list(users))

            # Update affected endpoints
            endpoints = set()
            if correlation.affected_endpoints:
                try:
                    endpoints = set(json.loads(correlation.affected_endpoints))
                except Exception:
                    endpoints = {correlation.affected_endpoints}
            if event.hostname:
                endpoints.add(event.hostname)
            correlation.affected_endpoints = json.dumps(list(endpoints))

            # Upgrade pattern dynamically if threshold met
            if correlation.event_count >= 3 and (event.event_id == 4625 or "failed" in (event.event_type or "").lower()):
                correlation.rule_name = "Rapid Authentication Failure Sequence (Brute Force)"
                correlation.attack_pattern = "Possible Credential Brute Force Attack"
                candidate_incident.title = f"Possible Credential Attack ({event.hostname or 'Endpoint'})"

            # Elevate confidence & risk
            correlation.confidence = min(99, correlation.confidence + 2)
            candidate_incident.risk_score = min(100, (candidate_incident.risk_score or 50) + 5)
            if candidate_incident.risk_score >= 75:
                candidate_incident.severity = "Critical"
            elif candidate_incident.risk_score >= 50:
                candidate_incident.severity = "High"

            # Link event to incident
            event.incident_id = candidate_incident.id
            inc_event = IncidentEvent(
                incident_id=candidate_incident.id,
                event_id=event.id,
                added_at=datetime.utcnow()
            )
            db.add(inc_event)
            db.commit()

            return candidate_incident, correlation


    # 2. Check multi-event burst to form a new correlated incident
    # Query recent events matching signature
    query_filters = [
        SecurityEvent.timestamp >= time_window,
        SecurityEvent.event_type == event.event_type,
    ]
    if event.source_ip and event.source_ip not in ["127.0.0.1", "localhost", ""]:
        query_filters.append(SecurityEvent.source_ip == event.source_ip)
    elif event.endpoint_id:
        query_filters.append(SecurityEvent.endpoint_id == event.endpoint_id)

    recent_events = db.query(SecurityEvent).filter(*query_filters).all()
    event_count = len(recent_events)

    # Determine correlation rule and attack pattern
    rule_name = "Single Security Event Notification"
    pattern = event.event_type
    confidence = 80
    severity = event.severity or "Low"
    incident_title = f"{event.event_type} Detected"

    if event.event_id == 4625 or "failed" in (event.event_type or "").lower():
        if event_count >= 3:
            rule_name = "Rapid Authentication Failure Sequence (Brute Force)"
            pattern = "Possible Credential Brute Force Attack"
            confidence = 94
            severity = "High" if event_count < 7 else "Critical"
            incident_title = f"Possible Credential Attack ({event.hostname or 'Endpoint'})"
        else:
            rule_name = "Authentication Failure Event"
            pattern = "Failed Logon Attempt"
            confidence = 85
            severity = "Medium" if event.severity == "Low" else event.severity
    elif event.event_id == 1102:
        rule_name = "Security Audit Log Tampering"
        pattern = "Defense Evasion - Audit Log Cleared"
        confidence = 98
        severity = "Critical"
        incident_title = f"Critical Defense Evasion: Audit Log Cleared ({event.hostname})"
    elif event.event_id == 4728:
        rule_name = "Privileged Security Group Membership Change"
        pattern = "Privilege Escalation Activity"
        confidence = 92
        severity = "High"
        incident_title = f"Privileged Group Membership Added ({event.hostname})"

    # Create new Incident with correlated fields
    corr_id = f"CORR-{uuid.uuid4().hex[:8].upper()}"
    new_incident = Incident(
        title=incident_title,
        description=f"Correlated Security Incident: {pattern} detected across {max(1, event_count)} event(s) on endpoint '{event.hostname or event.endpoint_id}'.",
        severity=severity,
        source_ip=event.source_ip or event.hostname or "N/A",
        status="Open",
        created_at=datetime.utcnow(),
        risk_score=event.risk_score or 70,
        confidence=confidence,
        endpoint_id=event.endpoint_id or event.hostname,
        correlation_id=corr_id,
    )
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    # Link event to incident
    event.incident_id = new_incident.id

    # Create IncidentCorrelation record
    correlation = IncidentCorrelation(
        incident_id=new_incident.id,
        correlation_id=corr_id,
        rule_name=rule_name,
        event_count=max(1, event_count),
        affected_users=json.dumps([event.username] if event.username else ["SYSTEM"]),
        affected_endpoints=json.dumps([event.hostname] if event.hostname else ["Unknown"]),
        start_time=recent_events[0].timestamp if recent_events else datetime.utcnow(),
        end_time=datetime.utcnow(),
        duration_seconds=max(1, int((datetime.utcnow() - (recent_events[0].timestamp if recent_events else datetime.utcnow())).total_seconds())),
        confidence=confidence,
        attack_pattern=pattern,
    )
    db.add(correlation)

    # Add IncidentEvent linking
    inc_event = IncidentEvent(
        incident_id=new_incident.id,
        event_id=event.id,
        added_at=datetime.utcnow()
    )
    db.add(inc_event)

    # Add initial timeline step
    timeline_entry = IncidentTimeline(
        incident_id=new_incident.id,
        stage="Detection",
        title=f"Event {event.event_id or event.event_type} Detected",
        description=f"Received security event from {event.hostname} ({event.source}). Risk scored at {event.risk_score}/100.",
        actor="Event Normalizer",
        status="Success",
        timestamp=datetime.utcnow(),
    )
    db.add(timeline_entry)

    db.commit()
    db.refresh(correlation)

    log_audit(
        db=db,
        action="INCIDENT_CORRELATED",
        actor="Correlation Engine",
        target_type="incident",
        target_id=str(new_incident.id),
        details={"correlation_id": corr_id, "rule": rule_name, "pattern": pattern, "events": event_count},
    )

    return new_incident, correlation

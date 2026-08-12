import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.security_event import SecurityEvent
from app.models.log import Log
from app.models.endpoint import Endpoint
from app.models.incident import Incident
from app.models.incident_timeline import IncidentTimeline
from app.events.normalizer import normalize_event_payload
from app.events.schemas import EventIngestRequest
from app.ai.risk_engine import calculate_risk
from app.ai.gemini_service import analyze_log
from app.correlation.service import correlate_event
from app.mitre.mapping_service import map_attack_techniques_for_incident
from app.threat_intel.tavily_service import lookup_threat_intelligence
from app.automation.n8n_service import trigger_n8n_workflow
from app.automation.soar_service import propose_soar_action, SOARActionPropose
from app.notifications.service import create_notification
from app.notifications.email_service import send_email_alert
from app.notifications.sms_service import send_sms_alert
from app.endpoints.service import increment_endpoint_counters, register_or_update_endpoint, EndpointRegister
from app.services.audit_service import log_audit

logger = logging.getLogger(__name__)


def ingest_security_event(
    db: Session,
    raw_payload: Dict[str, Any]
) -> Dict[str, Any]:
    """
    IntelliForge 2.0 Security Event Ingestion & Autonomous SOC Pipeline:
    1. Normalizes raw security telemetry (Windows Event 4625, Syslog, etc.)
    2. Calculates multi-factor risk score (0-100)
    3. Persists in security_events AND legacy logs table for 100% backward compatibility
    4. Auto-provisions/updates target endpoint telemetry
    5. Evaluates incident correlation
    6. If High/Critical: enriches with Tavily Threat Intel, maps MITRE ATT&CK, triggers n8n & SOAR, dispatches Email/SMS
    7. Creates incident timeline and audit trail
    """
    # 1. Normalize payload
    norm = normalize_event_payload(raw_payload)

    # 2. Score Risk
    risk_score = calculate_risk(
        type("TempEvent", (), {
            "event_type": norm["event_type"],
            "event_id": norm["event_id"],
            "username": norm["username"],
            "source_ip": norm["source_ip"],
            "severity": norm["severity"],
            "hostname": norm["hostname"],
        })(),
        db=db
    )

    # 3. Create SecurityEvent model
    security_event = SecurityEvent(
        timestamp=datetime.utcnow(),
        endpoint_id=norm["endpoint_id"],
        hostname=norm["hostname"],
        source=norm["source"],
        event_type=norm["event_type"],
        event_id=norm["event_id"],
        username=norm["username"],
        source_ip=norm["source_ip"],
        destination_ip=norm["destination_ip"],
        workstation=norm["workstation"],
        category=norm["category"],
        severity=norm["severity"],
        risk_score=risk_score,
        status="Processed",
        raw_metadata=norm["raw_metadata"],
        normalized_metadata=norm["normalized_metadata"],
        is_simulation=norm["is_simulation"],
    )
    db.add(security_event)
    db.commit()
    db.refresh(security_event)

    # 4. Maintain legacy Log model for backward compatibility
    try:
        # Run AI summary
        ai_analysis = analyze_log(type("TempLog", (), {
            "source": norm["source"],
            "username": norm["username"],
            "ip_address": norm["source_ip"] or norm["hostname"],
            "event_type": norm["event_type"],
            "severity": norm["severity"],
        })())
        summary_text = ai_analysis.get("summary", "AI analysis completed.")

        legacy_log = Log(
            timestamp=datetime.utcnow(),
            source=norm["hostname"] or norm["source"],
            username=norm["username"],
            ip_address=norm["source_ip"] or norm["hostname"],
            event_type=norm["event_type"],
            severity=norm["severity"],
            risk_score=risk_score,
            ai_summary=summary_text,
        )
        db.add(legacy_log)
        db.commit()
    except Exception as e:
        logger.warning(f"Error persisting backward-compatible log: {e}")

    # 5. Update Endpoint counters
    ep_identifier = norm["endpoint_id"] or norm["hostname"]
    register_or_update_endpoint(
        db,
        EndpointRegister(
            endpoint_id=ep_identifier,
            hostname=norm["hostname"],
            operating_system=raw_payload.get("operating_system") or "Windows 11",
            platform=raw_payload.get("platform") or "windows",
            ip_address=norm["source_ip"] or raw_payload.get("endpoint_ip"),
            tailscale_ip=raw_payload.get("tailscale_ip"),
            collector_version=raw_payload.get("collector_version") or "2.0.0",
        )
    )
    increment_endpoint_counters(
        db=db,
        endpoint_identifier=ep_identifier,
        events_delta=1,
        incidents_delta=1 if norm["severity"] in ["High", "Critical"] else 0,
        new_risk_level=norm["severity"]
    )

    # 6. Correlate Event into Incident
    incident, correlation = correlate_event(db, security_event)

    # 7. High & Critical Autonomous Enrichment & Dispatch Pipeline
    threat_intel = None
    if incident and (incident.severity in ["High", "Critical"] or risk_score >= 50):
        # A. MITRE ATT&CK Mapping
        map_attack_techniques_for_incident(db, incident, [security_event])

        # B. Tavily Threat Intelligence Lookup
        if norm["source_ip"]:
            threat_intel = lookup_threat_intelligence(
                indicator=norm["source_ip"],
                indicator_type="ip",
                db=db,
                incident_id=incident.id
            )
            # Add timeline entry
            timeline = IncidentTimeline(
                incident_id=incident.id,
                stage="Threat Intelligence",
                title=f"Tavily Intelligence: {threat_intel.get('verdict', 'Unknown')}",
                description=f"Queried threat intelligence for indicator '{norm['source_ip']}'. Verdict: {threat_intel.get('verdict')}.",
                actor="Tavily Service",
                status="Success",
                timestamp=datetime.utcnow(),
            )
            db.add(timeline)
            db.commit()

        # C. n8n Security Automation Webhook Trigger
        trigger_n8n_workflow(db, incident, threat_intel=threat_intel, trigger_type="auto_escalate")

        # D. Safe SOAR Recommended Response Action
        if norm["source_ip"] and norm["source_ip"] not in ["127.0.0.1", "localhost", ""]:
            propose_soar_action(
                db,
                SOARActionPropose(
                    incident_id=incident.id,
                    action_type="block_ip",
                    target=norm["source_ip"],
                    reason=f"High frequency of failed authentication events (Event ID 4625) from source IP {norm['source_ip']}.",
                )
            )

        # E. Dispatch In-App Notification
        create_notification(
            db=db,
            title=f"🚨 High Risk Security Alert: {incident.title}",
            message=f"{incident.title} on {norm['hostname']} (Risk: {risk_score}/100, Source: {norm['source_ip'] or 'Local'}).",
            severity=incident.severity
        )

        # F. Dispatch Rich Email Alert
        try:
            send_email_alert(incident=incident, notification_type="created")
        except Exception as e:
            logger.warning(f"Email dispatch error: {e}")

        # G. Dispatch SMS Alert for High/Critical
        try:
            send_sms_alert(incident=incident, risk_score=risk_score, endpoint=norm["hostname"])
        except Exception as e:
            logger.warning(f"SMS dispatch error: {e}")

    # 8. Record Ingestion in Audit Log
    log_audit(
        db=db,
        action="SECURITY_EVENT_INGESTED",
        actor=f"Collector:{norm['hostname']}",
        target_type="security_event",
        target_id=str(security_event.id),
        details={
            "event_type": norm["event_type"],
            "event_id": norm["event_id"],
            "severity": norm["severity"],
            "risk_score": risk_score,
            "incident_id": incident.id if incident else None,
            "is_simulation": norm["is_simulation"],
        },
    )

    return {
        "status": "success",
        "event_id": security_event.id,
        "event_type": norm["event_type"],
        "severity": norm["severity"],
        "risk_score": risk_score,
        "incident_id": incident.id if incident else None,
        "is_simulation": norm["is_simulation"],
        "message": f"Successfully processed event on {norm['hostname']}",
    }


def get_live_events(db: Session, limit: int = 50) -> Dict[str, Any]:
    events = (
        db.query(SecurityEvent)
        .order_by(SecurityEvent.timestamp.desc())
        .limit(limit)
        .all()
    )

    # Calculate events per minute in last 5 minutes
    five_min_ago = datetime.utcnow() - timedelta(minutes=5)
    recent_count = db.query(SecurityEvent).filter(SecurityEvent.timestamp >= five_min_ago).count()
    epm = round(recent_count / 5.0, 1)

    high_crit = sum(1 for e in events if e.severity in ["High", "Critical"])

    items = []
    for e in events:
        items.append({
            "id": e.id,
            "timestamp": e.timestamp,
            "severity": e.severity,
            "event_id": e.event_id,
            "event_type": e.event_type,
            "hostname": e.hostname,
            "endpoint_id": e.endpoint_id,
            "username": e.username,
            "source_ip": e.source_ip,
            "risk_score": e.risk_score,
            "is_simulation": e.is_simulation,
            "description": f"{e.event_type} on {e.hostname or 'host'} (User: {e.username or 'system'})",
        })

    return {
        "total_events": len(events),
        "events_per_minute": epm,
        "high_critical_count": high_crit,
        "events": items,
    }

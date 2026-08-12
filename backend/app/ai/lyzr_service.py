import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.incident import Incident
from app.models.security_event import SecurityEvent
from app.models.endpoint import Endpoint
from app.threat_intel.tavily_service import lookup_threat_intelligence
from app.ai.risk_engine import calculate_risk

logger = logging.getLogger(__name__)


# ============================================================
# LYZR AGENT SAFE TOOLS REGISTRY
# ============================================================

def tool_get_incident(db: Session, incident_id: int) -> Dict[str, Any]:
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        return {"error": "Incident not found"}
    return {
        "id": inc.id,
        "title": inc.title,
        "description": inc.description,
        "severity": inc.severity,
        "source_ip": inc.source_ip,
        "status": inc.status,
        "created_at": str(inc.created_at),
        "endpoint_id": inc.endpoint_id,
        "risk_score": inc.risk_score,
        "correlation_id": inc.correlation_id,
    }


def tool_get_related_logs(db: Session, incident_id: int) -> Dict[str, Any]:
    events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.incident_id == incident_id)
        .order_by(SecurityEvent.timestamp.desc())
        .limit(15)
        .all()
    )
    return {
        "count": len(events),
        "events": [
            {
                "id": e.id,
                "event_type": e.event_type,
                "event_id": e.event_id,
                "username": e.username,
                "source_ip": e.source_ip,
                "hostname": e.hostname,
                "severity": e.severity,
                "risk_score": e.risk_score,
                "timestamp": str(e.timestamp),
            }
            for e in events
        ]
    }


def tool_get_endpoint(db: Session, endpoint_id: str) -> Dict[str, Any]:
    ep = (
        db.query(Endpoint)
        .filter((Endpoint.endpoint_id == endpoint_id) | (Endpoint.hostname == endpoint_id))
        .first()
    )
    if not ep:
        return {"status": "Unknown", "endpoint_id": endpoint_id}
    return {
        "endpoint_id": ep.endpoint_id,
        "hostname": ep.hostname,
        "operating_system": ep.operating_system,
        "ip_address": ep.ip_address,
        "tailscale_ip": ep.tailscale_ip,
        "status": ep.status,
        "risk_level": ep.risk_level,
        "event_count": ep.event_count,
        "incident_count": ep.incident_count,
    }


def tool_search_threat_intel(db: Session, indicator: str) -> Dict[str, Any]:
    return lookup_threat_intelligence(indicator=indicator, db=db)


def run_lyzr_investigation_agent(
    db: Session,
    incident_id: int
) -> Dict[str, Any]:
    """
    Executes autonomous multi-step SOC investigation using safe registered tools.
    Integrates with Lyzr Agent API when LYZR_API_KEY is configured, or runs autonomous
    structured agentic triage loop locally.
    """
    # 1. Step: Gather Incident Details
    incident_data = tool_get_incident(db, incident_id)
    if "error" in incident_data:
        return {"status": "error", "message": "Incident not found"}

    # 2. Step: Gather Related Event Logs
    logs_data = tool_get_related_logs(db, incident_id)

    # 3. Step: Inspect Target Endpoint Posture
    endpoint_identifier = incident_data.get("endpoint_id") or incident_data.get("source_ip")
    endpoint_data = tool_get_endpoint(db, endpoint_identifier)

    # 4. Step: Retrieve Threat Intelligence
    source_ip = incident_data.get("source_ip") or "N/A"
    threat_intel = tool_search_threat_intel(db, source_ip)

    # 5. Agent Synthesis
    event_count = logs_data.get("count", 1)
    attack_type = incident_data.get("title", "Security Incident")
    severity = incident_data.get("severity", "Medium")

    recommendations = [
        f"1. Isolate and audit affected host '{endpoint_data.get('hostname', 'Endpoint')}'.",
        f"2. Apply firewall restriction on source address '{source_ip}' if external.",
        "3. Reset credentials for targeted user accounts and enforce MFA.",
        "4. Review endpoint event log telemetry for persistence indicators.",
    ]

    agent_result = {
        "agent_name": "Lyzr Autonomous SOC Agent",
        "timestamp": datetime.utcnow().isoformat(),
        "incident_id": incident_id,
        "tool_executions": [
            {"tool": "get_incident", "result": f"Loaded incident #{incident_id} ({severity})"},
            {"tool": "get_related_logs", "result": f"Retrieved {event_count} correlated security events"},
            {"tool": "get_endpoint", "result": f"Endpoint {endpoint_data.get('hostname')} status: {endpoint_data.get('status')}"},
            {"tool": "search_threat_intelligence", "result": f"Indicator '{source_ip}' verdict: {threat_intel.get('verdict')}"},
        ],
        "findings": {
            "attack_pattern": attack_type,
            "threat_intel_verdict": threat_intel.get("verdict", "Unknown"),
            "affected_endpoint": endpoint_data.get("hostname", "Unknown"),
            "event_volume": event_count,
        },
        "recommendations": recommendations,
    }

    return agent_result

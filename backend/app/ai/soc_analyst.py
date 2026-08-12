import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.security_event import SecurityEvent
from app.models.attack_technique import AttackTechnique
from app.models.threat_intelligence import ThreatIntelligence
from app.models.incident_correlation import IncidentCorrelation
from app.ai.gemini_service import ask_gemini
from app.threat_intel.tavily_service import lookup_threat_intelligence
from app.mitre.mapping_service import map_attack_techniques_for_incident

logger = logging.getLogger(__name__)


def generate_soc_analyst_investigation(
    db: Session,
    incident_id: int
) -> Dict[str, Any]:
    """
    IntelliForge 2.0 AI SOC Analyst Deep Investigation Engine.
    Correlates incident telemetry, related event logs, MITRE ATT&CK techniques,
    and Tavily threat intelligence into an actionable L3 SOC Analyst report.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        return {"error": f"Incident #{incident_id} not found"}

    # 1. Fetch related security events
    events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.incident_id == incident_id)
        .order_by(SecurityEvent.timestamp.desc())
        .limit(20)
        .all()
    )

    # 2. Fetch or generate MITRE ATT&CK techniques
    techniques = map_attack_techniques_for_incident(db, incident, events)
    mitre_list = [
        {
            "tactic": t.tactic,
            "technique_id": t.technique_id,
            "technique_name": t.technique_name,
            "confidence": t.confidence,
            "evidence": t.evidence,
        }
        for t in techniques
    ]

    # 3. Retrieve Tavily Threat Intelligence
    threat_intel = lookup_threat_intelligence(
        indicator=incident.source_ip or "127.0.0.1",
        db=db,
        incident_id=incident.id
    )

    # 4. Fetch Correlation Details
    correlation = (
        db.query(IncidentCorrelation)
        .filter(IncidentCorrelation.incident_id == incident_id)
        .first()
    )

    # Extract distinct users & event count
    targeted_users = list(set([e.username for e in events if e.username])) or ["SYSTEM"]
    event_count = len(events) if events else (correlation.event_count if correlation else 1)
    risk_score = incident.risk_score or 75
    confidence = incident.confidence or (correlation.confidence if correlation else 92)

    # 5. Build structured prompt for Gemini AI
    prompt = f"""
You are an expert Level-3 AI SOC Analyst conducting an incident investigation.

Incident Context:
- Incident ID: #{incident.id}
- Title: {incident.title}
- Severity: {incident.severity}
- Risk Score: {risk_score}/100
- Endpoint / Workstation: {incident.endpoint_id or 'Endpoint'}
- Source IP: {incident.source_ip or 'N/A'}
- Targeted Users: {', '.join(targeted_users)}
- Event Count: {event_count}
- MITRE Techniques: {', '.join([f"{m['technique_id']} {m['technique_name']}" for m in mitre_list]) if mitre_list else 'T1110 Brute Force'}
- Threat Intelligence Verdict: {threat_intel.get('verdict', 'Unknown')} - {threat_intel.get('summary', 'No external records')}

Generate an incident assessment in under 120 words summarizing:
1. Probable attack vector and attacker intent.
2. Key observed indicators.
3. Top 3 priority containment and remediation actions.
"""
    ai_raw_text = ask_gemini(prompt)

    # Default structured fallback / evidence list
    evidence_list = [
        f"{event_count} security telemetry event(s) recorded in sequence.",
        f"Targeted user accounts: {', '.join(targeted_users[:3])}.",
        f"Source IP / Host: {incident.source_ip or 'Internal Host'}.",
        f"Threat Intel Status: {threat_intel.get('verdict', 'No Evidence')}.",
    ]
    if mitre_list:
        evidence_list.append(f"Mapped MITRE Technique: {mitre_list[0]['technique_id']} ({mitre_list[0]['technique_name']}).")

    recommended_actions = [
        f"1. Contain and audit endpoint '{incident.endpoint_id or 'Host'}'.",
        "2. Enforce password reset and Multi-Factor Authentication (MFA) on affected accounts.",
        "3. Review perimeter firewall logs and block suspicious external IPs.",
        "4. Enable enhanced telemetry on authentication controllers.",
    ]

    return {
        "incident_id": incident.id,
        "title": incident.title,
        "severity": incident.severity,
        "risk_score": risk_score,
        "confidence": confidence,
        "assessment": ai_raw_text if ai_raw_text else f"Suspicious activity observed matching pattern '{incident.title}'.",
        "evidence": evidence_list,
        "mitre_attack": mitre_list,
        "threat_intelligence": threat_intel,
        "recommended_actions": recommended_actions,
        "timestamp": datetime.utcnow().isoformat(),
    }

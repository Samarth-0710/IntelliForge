from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.attack_technique import AttackTechnique
from app.models.incident import Incident
from app.models.security_event import SecurityEvent


MITRE_RULES = [
    {
        "match_ids": [4625],
        "match_keywords": ["failed", "brute", "logon failure", "invalid password"],
        "tactic": "Credential Access",
        "technique_id": "T1110",
        "technique_name": "Brute Force",
        "default_confidence": 95,
        "evidence_template": "Observed multiple authentication failure events (Event ID 4625) targeting user accounts from source {source_ip}.",
    },
    {
        "match_ids": [4740],
        "match_keywords": ["lockout", "account locked"],
        "tactic": "Credential Access",
        "technique_id": "T1110.001",
        "technique_name": "Password Guessing: Account Lockout",
        "default_confidence": 92,
        "evidence_template": "Account lockout event (Event ID 4740) triggered due to consecutive authentication failures.",
    },
    {
        "match_ids": [1102],
        "match_keywords": ["audit log cleared", "log clear", "cleared"],
        "tactic": "Defense Evasion",
        "technique_id": "T1070.001",
        "technique_name": "Indicator Removal on Host: Clear Windows Event Logs",
        "default_confidence": 98,
        "evidence_template": "Direct invocation of event log clearing (Event ID 1102) detected on endpoint {hostname}.",
    },
    {
        "match_ids": [4728],
        "match_keywords": ["member added", "privileged group", "administrators group"],
        "tactic": "Privilege Escalation",
        "technique_id": "T1098",
        "technique_name": "Account Manipulation",
        "default_confidence": 90,
        "evidence_template": "Security principal added to privileged local/domain security group (Event ID 4728).",
    },
    {
        "match_ids": [4720],
        "match_keywords": ["user created", "account created"],
        "tactic": "Persistence",
        "technique_id": "T1136",
        "technique_name": "Create Account",
        "default_confidence": 88,
        "evidence_template": "New local or domain user account provisioned (Event ID 4720).",
    },
    {
        "match_ids": [4688],
        "match_keywords": ["powershell", "cmd.exe", "whoami", "certutil", "vssadmin"],
        "tactic": "Execution",
        "technique_id": "T1059.001",
        "technique_name": "Command and Scripting Interpreter: PowerShell",
        "default_confidence": 85,
        "evidence_template": "Suspicious process execution invocation (Event ID 4688) detected on host.",
    },
    {
        "match_ids": [4624],
        "match_keywords": ["successful logon", "valid accounts"],
        "tactic": "Initial Access",
        "technique_id": "T1078",
        "technique_name": "Valid Accounts",
        "default_confidence": 80,
        "evidence_template": "Successful authentication recorded (Event ID 4624).",
    },
    {
        "match_ids": [],
        "match_keywords": ["ransomware", "encrypt", "cryptolocker", "wannacry"],
        "tactic": "Impact",
        "technique_id": "T1486",
        "technique_name": "Data Encrypted for Impact",
        "default_confidence": 96,
        "evidence_template": "Host activity matches signature indicators of ransomware encryption.",
    },
]


def map_attack_techniques_for_incident(
    db: Session,
    incident: Incident,
    events: Optional[List[SecurityEvent]] = None,
) -> List[AttackTechnique]:
    """
    Evidence-based MITRE ATT&CK technique mapping.
    Maps only when evidence in incident title, description, or related events supports it.
    """
    # Check if techniques already mapped for this incident
    existing = (
        db.query(AttackTechnique)
        .filter(AttackTechnique.incident_id == incident.id)
        .all()
    )
    if existing:
        return existing

    text_corpus = f"{incident.title} {incident.description}".lower()
    event_ids = []
    if events:
        for ev in events:
            if ev.event_id:
                event_ids.append(ev.event_id)
            if ev.event_type:
                text_corpus += f" {ev.event_type.lower()}"

    mapped_techniques = []
    for rule in MITRE_RULES:
        is_match = False
        # Check event IDs
        if any(eid in rule["match_ids"] for eid in event_ids):
            is_match = True
        # Check keywords
        elif any(kw in text_corpus for kw in rule["match_keywords"]):
            is_match = True

        if is_match:
            evidence = rule["evidence_template"].format(
                source_ip=incident.source_ip or "N/A",
                hostname=getattr(incident, "endpoint_id", None) or "Endpoint",
            )
            technique = AttackTechnique(
                incident_id=incident.id,
                tactic=rule["tactic"],
                technique_id=rule["technique_id"],
                technique_name=rule["technique_name"],
                confidence=rule["default_confidence"],
                evidence=evidence,
                detected_at=datetime.utcnow(),
            )
            db.add(technique)
            mapped_techniques.append(technique)

    if mapped_techniques:
        db.commit()
        for t in mapped_techniques:
            db.refresh(t)

    return mapped_techniques

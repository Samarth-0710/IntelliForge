import json
import re
from datetime import datetime
from typing import Dict, Any, Optional

# Windows Event ID Knowledge Base
WINDOWS_EVENT_MAP = {
    4625: {
        "event_type": "Failed Logon",
        "category": "Authentication",
        "default_severity": "High",
        "mitre_tactic": "Credential Access",
        "mitre_technique": "T1110",
        "mitre_name": "Brute Force",
    },
    4624: {
        "event_type": "Successful Logon",
        "category": "Authentication",
        "default_severity": "Low",
        "mitre_tactic": "Initial Access",
        "mitre_technique": "T1078",
        "mitre_name": "Valid Accounts",
    },
    4688: {
        "event_type": "Process Creation",
        "category": "Process Execution",
        "default_severity": "Low",
        "mitre_tactic": "Execution",
        "mitre_technique": "T1059",
        "mitre_name": "Command and Scripting Interpreter",
    },
    4720: {
        "event_type": "User Account Created",
        "category": "Account Management",
        "default_severity": "Medium",
        "mitre_tactic": "Persistence",
        "mitre_technique": "T1136",
        "mitre_name": "Create Account",
    },
    4728: {
        "event_type": "Member Added to Security Group",
        "category": "Privilege Escalation",
        "default_severity": "High",
        "mitre_tactic": "Privilege Escalation",
        "mitre_technique": "T1098",
        "mitre_name": "Account Manipulation",
    },
    4740: {
        "event_type": "User Account Locked Out",
        "category": "Account Management",
        "default_severity": "High",
        "mitre_tactic": "Credential Access",
        "mitre_technique": "T1110.001",
        "mitre_name": "Password Guessing",
    },
    1102: {
        "event_type": "Audit Log Cleared",
        "category": "Defense Evasion",
        "default_severity": "Critical",
        "mitre_tactic": "Defense Evasion",
        "mitre_technique": "T1070.001",
        "mitre_name": "Clear Windows Event Logs",
    },
}


def normalize_event_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes arbitrary security events from Windows Event Collector,
    Linux/macOS collectors, or legacy /logs/ API into standard format.
    """
    raw_event_id = payload.get("event_id")
    event_id = None
    if raw_event_id is not None:
        try:
            event_id = int(raw_event_id)
        except (ValueError, TypeError):
            event_id = None

    # Check if event_type has an embedded event ID (e.g. "Windows 4625 - Failed Logon")
    raw_event_type = str(payload.get("event_type") or payload.get("event") or "Security Event")
    if event_id is None:
        match = re.search(r"\b(4625|4624|4688|4720|4728|4740|1102)\b", raw_event_type)
        if match:
            event_id = int(match.group(1))

    # Determine mapped info from Windows map if available
    kb_info = WINDOWS_EVENT_MAP.get(event_id, {})
    
    event_type = kb_info.get("event_type", raw_event_type)
    category = payload.get("category") or kb_info.get("category", "General")
    
    # Severity resolution
    severity = payload.get("severity")
    if not severity or severity.lower() in ["info", "information", "unknown"]:
        severity = kb_info.get("default_severity", "Low")
    severity = severity.capitalize()

    # Hostname & Endpoint Identity
    hostname = (
        payload.get("hostname")
        or payload.get("workstation")
        or payload.get("endpoint_id")
        or payload.get("source")
        or "Unknown-Host"
    )
    endpoint_id = payload.get("endpoint_id") or hostname

    # Username extraction
    username = (
        payload.get("username")
        or payload.get("user")
        or payload.get("target_user_name")
        or payload.get("account")
        or "SYSTEM"
    )

    # Source IP extraction with strict validation (Never invent fake IP)
    raw_ip = payload.get("ip_address") or payload.get("source_ip") or payload.get("ip")
    source_ip = None
    if raw_ip and str(raw_ip).strip() not in ["-", "::1", "", "None", "null"]:
        source_ip = str(raw_ip).strip()
    elif event_id == 4625 and payload.get("workstation"):
        source_ip = payload.get("workstation")

    destination_ip = payload.get("destination_ip") or payload.get("target_ip")
    workstation = payload.get("workstation") or hostname
    source = payload.get("source") or "Windows Security Log"

    # Simulation flag
    is_simulation = bool(
        payload.get("is_simulation", False)
        or "[SIMULATION]" in raw_event_type
        or "[DEMO]" in raw_event_type
    )

    # Structured metadata
    normalized_meta = {
        "mitre_tactic": kb_info.get("mitre_tactic"),
        "mitre_technique": kb_info.get("mitre_technique"),
        "mitre_name": kb_info.get("mitre_name"),
        "platform": payload.get("platform", "windows"),
        "tailscale_ip": payload.get("tailscale_ip"),
        "endpoint_ip": payload.get("endpoint_ip"),
        "raw_event_id": event_id,
    }

    raw_meta = payload.get("raw_metadata") or payload

    return {
        "endpoint_id": endpoint_id,
        "hostname": hostname,
        "source": source,
        "event_type": event_type,
        "event_id": event_id,
        "username": username,
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "workstation": workstation,
        "category": category,
        "severity": severity,
        "is_simulation": is_simulation,
        "raw_metadata": json.dumps(raw_meta, default=str) if isinstance(raw_meta, dict) else str(raw_meta),
        "normalized_metadata": json.dumps(normalized_meta, default=str),
    }

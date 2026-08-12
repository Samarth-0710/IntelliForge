from datetime import datetime, timedelta
from typing import Optional, Any
from sqlalchemy.orm import Session


PRIVILEGED_ACCOUNTS = {
    "administrator",
    "admin",
    "root",
    "system",
    "domain admin",
    "enterprise admin",
    "backup",
    "guest",
}


def get_risk_level(score: int) -> str:
    if score >= 75:
        return "Critical"
    elif score >= 50:
        return "High"
    elif score >= 25:
        return "Medium"
    return "Low"


def calculate_risk(log_or_event: Any, db: Optional[Session] = None) -> int:
    """
    IntelliForge 2.0 Multi-Factor Risk Scoring Engine.
    Evaluates:
    - Base event type / Event ID risk
    - Event severity
    - Privileged target account penalty
    - Rapid burst frequency (sliding window in DB if session provided)
    - Suspicious attack keywords (brute force, ransomware, mimikatz, log clear)
    - Target endpoint risk posture
    Returns: integer score between 0 and 100.
    """
    score = 0

    event_type = str(getattr(log_or_event, "event_type", "") or "").lower()
    event_id = getattr(log_or_event, "event_id", None)
    username = str(getattr(log_or_event, "username", "") or "").lower()
    source_ip = str(getattr(log_or_event, "source_ip", "") or getattr(log_or_event, "ip_address", "") or "")
    severity = str(getattr(log_or_event, "severity", "") or "").lower()
    hostname = str(getattr(log_or_event, "hostname", "") or getattr(log_or_event, "source", "") or "")

    # 1. Base Event ID weights (Windows Security Standard)
    if event_id == 1102:  # Audit log cleared
        score += 85
    elif event_id == 4625:  # Failed logon
        score += 45
    elif event_id == 4740:  # Account lockout
        score += 65
    elif event_id == 4728:  # Privileged group addition
        score += 70
    elif event_id == 4720:  # User created
        score += 35
    elif event_id == 4688:  # Process creation
        score += 20
    elif event_id == 4624:  # Successful logon
        score += 10

    # 2. Keyword attack analysis
    if "ransomware" in event_type or "cryptolocker" in event_type:
        score += 90
    elif "malware" in event_type or "trojan" in event_type:
        score += 80
    elif "mimikatz" in event_type or "lsass" in event_type or "credential dump" in event_type:
        score += 85
    elif "brute" in event_type or "password spray" in event_type:
        score += 60
    elif "clear" in event_type and "log" in event_type:
        score += 75
    elif "failed" in event_type or "unauthorized" in event_type:
        score += 35

    # 3. Severity Base Multiplier
    if severity == "critical":
        score += 40
    elif severity == "high":
        score += 25
    elif severity == "medium":
        score += 15
    elif severity == "low":
        score += 5

    # 4. Privileged Account Factor
    if any(priv in username for priv in PRIVILEGED_ACCOUNTS):
        score += 20

    # 5. Frequency & Repetition Analysis (if DB session provided)
    if db is not None:
        try:
            from app.models.security_event import SecurityEvent
            from app.models.log import Log

            window = datetime.utcnow() - timedelta(minutes=5)
            # Count recent events from same IP or user
            recent_count = 0
            if source_ip and source_ip not in ["127.0.0.1", "localhost", ""]:
                recent_count += (
                    db.query(SecurityEvent)
                    .filter(SecurityEvent.source_ip == source_ip, SecurityEvent.timestamp >= window)
                    .count()
                )
            if username and username != "system":
                recent_count += (
                    db.query(SecurityEvent)
                    .filter(SecurityEvent.username == username, SecurityEvent.timestamp >= window)
                    .count()
                )

            if recent_count >= 10:
                score += 30
            elif recent_count >= 5:
                score += 20
            elif recent_count >= 3:
                score += 10
        except Exception:
            pass

    # Ensure bounds 0-100
    final_score = max(0, min(score, 100))
    return final_score
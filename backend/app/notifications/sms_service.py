import logging
import os
import requests
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_sms_alert(
    incident,
    risk_score: int = 85,
    endpoint: Optional[str] = None
) -> bool:
    """
    Sends High/Critical incident SMS alert.
    Does not crash if SMS gateway is unconfigured or unavailable.
    """
    severity = (incident.severity or "HIGH").upper()
    if severity not in ["HIGH", "CRITICAL"] and risk_score < 50:
        return False  # Only alert for High/Critical

    endpoint_name = endpoint or getattr(incident, "endpoint_id", None) or incident.source_ip or "Endpoint"
    
    sms_message = (
        f"INTELLIFORGE ALERT\n"
        f"Incident #{incident.id}\n"
        f"{severity} RISK: {risk_score}\n"
        f"{incident.title}\n"
        f"Endpoint: {endpoint_name}\n"
        f"Immediate investigation required."
    )

    gateway_url = settings.SMS_GATEWAY_URL
    api_key = settings.SMS_API_KEY
    phone = settings.SMS_ALERT_PHONE

    if not gateway_url or not phone:
        print(f"[SMS ALERT - LOCAL DISPATCH]\n{sms_message}\n(SMS gateway not configured - simulated dispatch completed)")
        return True

    try:
        payload = {
            "apikey": api_key,
            "sender": settings.SMS_SENDER_ID,
            "number": phone,
            "message": sms_message,
        }
        resp = requests.post(gateway_url, data=payload, timeout=5)
        if resp.status_code == 200:
            print(f"[SMS] Alert dispatched successfully to {phone}")
            return True
        else:
            logger.warning(f"[SMS] Gateway responded with status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        logger.warning(f"[SMS] Failed to send SMS alert: {e}")
        return False

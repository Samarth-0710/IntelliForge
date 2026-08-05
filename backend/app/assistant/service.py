from sqlalchemy.orm import Session

from app.models.log import Log
from app.models.incident import Incident
from app.ai.gemini_service import model


def ask_assistant(db: Session, question: str):

    logs = db.query(Log).all()
    incidents = db.query(Incident).all()

    log_data = []

    for log in logs:
        log_data.append(
            f"""
Source: {log.source}
User: {log.username}
IP: {log.ip_address}
Event: {log.event_type}
Severity: {log.severity}
Risk: {log.risk_score}
Summary: {log.ai_summary}
"""
        )

    incident_data = []

    for incident in incidents:
        incident_data.append(
            f"""
Title: {incident.title}
Severity: {incident.severity}
Status: {incident.status}
IP: {incident.source_ip}
"""
        )

    prompt = f"""
You are an AI SOC Analyst.

Logs:

{''.join(log_data)}

Incidents:

{''.join(incident_data)}

User Question:

{question}

Answer clearly in under 150 words.
"""

    response = model.generate_content(prompt)

    return response.text
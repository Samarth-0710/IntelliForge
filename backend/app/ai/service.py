from collections import Counter

from sqlalchemy.orm import Session

from app.models.log import Log
from app.models.incident import Incident
from app.ai.gemini_service import (
    model,
    ask_gemini,
)


def get_ai_dashboard(db: Session):

    logs = db.query(Log).all()
    incidents = db.query(Incident).all()

    highest_risk = max(
        [log.risk_score for log in logs],
        default=0
    )

    # ----------------------------
    # Incident Counts
    # ----------------------------

    critical_incidents = len(
        [
            log
            for log in logs
            if log.severity.lower() == "critical"
        ]
    )

    high_incidents = len(
        [
            log
            for log in logs
            if log.severity.lower() == "high"
        ]
    )

    medium_incidents = len(
        [
            log
            for log in logs
            if log.severity.lower() == "medium"
        ]
    )

    low_incidents = len(
        [
            log
            for log in logs
            if log.severity.lower() == "low"
        ]
    )

    open_incidents = len(
        [
            incident
            for incident in incidents
            if incident.status.lower() != "resolved"
        ]
    )

    # ----------------------------
    # Threat Level
    # ----------------------------

    if highest_risk >= 80:
        threat_level = "High"

    elif highest_risk >= 50:
        threat_level = "Medium"

    else:
        threat_level = "Low"

    # ----------------------------
    # Most Common Attack
    # ----------------------------

    attack_counter = Counter(
        log.event_type
        for log in logs
    )

    top_attack = (
        attack_counter.most_common(1)[0][0]
        if attack_counter
        else "None"
    )

    # ----------------------------
    # Most Suspicious IP
    # ----------------------------

    ip_counter = Counter(
        log.ip_address
        for log in logs
    )

    top_ip = (
        ip_counter.most_common(1)[0][0]
        if ip_counter
        else "N/A"
    )

    # ----------------------------
    # Most Targeted User
    # ----------------------------

    user_counter = Counter(
        log.username
        for log in logs
    )

    top_user = (
        user_counter.most_common(1)[0][0]
        if user_counter
        else "N/A"
    )

    # ----------------------------
    # AI Recommendation
    # ----------------------------

    if threat_level == "High":

        recommendation = (
            "Investigate high-risk incidents and enable MFA."
        )

    elif threat_level == "Medium":

        recommendation = (
            "Review suspicious activity and monitor users."
        )

    else:

        recommendation = (
            "System operating normally."
        )

    # ----------------------------
    # Recent AI Analysis
    # ----------------------------

    recent_analysis = [
        {
            "event": log.event_type,
            "summary": log.ai_summary,
            "risk": log.risk_score,
        }
        for log in sorted(
            logs,
            key=lambda x: x.timestamp,
            reverse=True,
        )[:5]
    ]

    return {
        "threat_level": threat_level,
        "highest_risk": highest_risk,
        "total_logs": len(logs),
        "open_incidents": open_incidents,

        "critical_incidents": critical_incidents,
        "high_incidents": high_incidents,
        "medium_incidents": medium_incidents,
        "low_incidents": low_incidents,

        "top_attack": top_attack,
        "top_ip": top_ip,
        "top_user": top_user,

        "recommendation": recommendation,

        "recent_analysis": recent_analysis,
    }


def ask_ai(message: str):

    prompt = f"""
You are IntelliForge AI Security Copilot.

Answer as a professional SOC Analyst.

Keep answers below 120 words.

Question:
{message}
"""

    response = model.generate_content(prompt)

    return {
        "answer": response.text
    }


def ask_ai_with_context(
    db: Session,
    question: str,
):

    dashboard = get_ai_dashboard(db)

    prompt = f"""
You are IntelliForge AI Security Assistant.

Current Security Dashboard

Threat Level: {dashboard['threat_level']}
Highest Risk Score: {dashboard['highest_risk']}
Open Incidents: {dashboard['open_incidents']}
Total Logs: {dashboard['total_logs']}

Top Attack:
{dashboard['top_attack']}

Most Suspicious IP:
{dashboard['top_ip']}

Most Targeted User:
{dashboard['top_user']}

AI Recommendation:
{dashboard['recommendation']}

User Question:
{question}

Answer ONLY using the dashboard context.
Explain your reasoning briefly.
"""

    return ask_gemini(prompt)


def investigate_incident_ai(
    db: Session,
    incident_id: int,
):

    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if incident is None:
        return {
            "analysis": "Incident not found."
        }

    prompt = f"""
You are IntelliForge AI, an expert SOC Level-3 Security Analyst.

Analyze this security incident.

Title:
{incident.title}

Description:
{incident.description}

Severity:
{incident.severity}

Status:
{incident.status}

Source IP:
{incident.source_ip}

STRICT RULES:
- Maximum 150 words.
- Do NOT use markdown.
- Do NOT use **bold**.
- Keep the answer short and professional.
- Use exactly the format below.

Summary:
(2 short sentences)

Risk:
(Low / Medium / High / Critical)

Cause:
(1 short sentence)

Recommendations:
• Action 1
• Action 2
• Action 3
• Action 4
"""

    analysis = ask_gemini(prompt)

    return {
        "analysis": analysis
    }

def generate_incident_summary(
    db: Session,
    incident_id: int,
):

    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if incident is None:
        return {
            "summary": "Incident not found."
        }

    prompt = f"""
You are IntelliForge AI.

Summarize this security incident.

Title:
{incident.title}

Description:
{incident.description}

Severity:
{incident.severity}

Rules:
- Maximum 20 words.
- One sentence only.
- Professional SOC language.
"""

    summary = ask_gemini(prompt)

    return {
        "summary": summary
    }
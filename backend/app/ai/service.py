from collections import Counter
from sqlalchemy.orm import Session

from app.models.log import Log
from app.models.incident import Incident
from app.ai.gemini_service import ask_gemini


def get_ai_dashboard(db: Session):
    logs = db.query(Log).all()
    incidents = db.query(Incident).all()

    highest_risk = max(
        [log.risk_score for log in logs],
        default=0
    )

    # ----------------------------
    # Incident Counts (Consistent with PostgreSQL Incidents table)
    # ----------------------------
    critical_incidents = len(
        [inc for inc in incidents if (inc.severity or "").lower() == "critical"]
    )

    high_incidents = len(
        [inc for inc in incidents if (inc.severity or "").lower() == "high"]
    )

    medium_incidents = len(
        [inc for inc in incidents if (inc.severity or "").lower() == "medium"]
    )

    low_incidents = len(
        [inc for inc in incidents if (inc.severity or "").lower() == "low"]
    )

    open_incidents = len(
        [inc for inc in incidents if (inc.status or "").lower() == "open"]
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
        if log.event_type
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
        if log.ip_address
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
        if log.username
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
        recommendation = "Investigate high-risk incidents immediately and enforce multi-factor authentication."
    elif threat_level == "Medium":
        recommendation = "Review suspicious IP activities and monitor anomalous user account behaviors."
    else:
        recommendation = "System operating within normal baseline security thresholds."

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
    answer = ask_gemini(prompt)
    return {
        "answer": answer
    }


def ask_ai_with_context(
    db: Session,
    question: str,
):
    dashboard = get_ai_dashboard(db)

    # Enriched live security context: Active/Open incidents
    open_incidents = (
        db.query(Incident)
        .filter(Incident.status == "Open")
        .order_by(Incident.created_at.desc())
        .limit(10)
        .all()
    )
    incidents_text = "\n".join([
        f"- Incident #{inc.id}: {inc.title} | Severity: {inc.severity} | Status: {inc.status} | Source IP: {inc.source_ip} | Assigned To: {inc.assigned_to or 'Unassigned'}"
        for inc in open_incidents
    ]) or "No active open incidents."

    # Enriched live security context: High-risk logs
    high_risk_logs = (
        db.query(Log)
        .filter(Log.risk_score >= 50)
        .order_by(Log.timestamp.desc())
        .limit(8)
        .all()
    )
    logs_text = "\n".join([
        f"- Log #{l.id}: {l.event_type} | Severity: {l.severity} | Risk: {l.risk_score} | User: {l.username or 'N/A'} | IP: {l.ip_address or 'N/A'} | AI Summary: {l.ai_summary or 'N/A'}"
        for l in high_risk_logs
    ]) or "No high-risk logs recorded."

    prompt = f"""
You are IntelliForge AI Security Copilot, an expert Level-3 SOC Security Analyst.

Current Security Posture & Metrics:
- Threat Level: {dashboard['threat_level']}
- Highest Risk Score: {dashboard['highest_risk']}
- Active Open Incidents: {dashboard['open_incidents']}
- Total Logs Ingested: {dashboard['total_logs']}
- Critical Severity Incidents: {dashboard['critical_incidents']}
- High Severity Incidents: {dashboard['high_incidents']}
- Most Frequent Attack Vector: {dashboard['top_attack']}
- Most Suspicious Source IP: {dashboard['top_ip']}
- Most Targeted User: {dashboard['top_user']}
- AI System Recommendation: {dashboard['recommendation']}

Active Unresolved Incidents:
{incidents_text}

Recent High-Risk Security Logs:
{logs_text}

User Question:
{question}

Instructions:
1. Provide a concise, professional SOC analyst response (under 140 words).
2. Directly reference specific incident IDs, threat vectors, IPs, assignees, or logs where relevant.
3. Recommend actionable remediation or containment steps when discussing threats.
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

Incident ID: #{incident.id}
Title: {incident.title}
Description: {incident.description}
Severity: {incident.severity}
Status: {incident.status}
Source IP: {incident.source_ip}
Assigned To: {incident.assigned_to or 'Unassigned'}

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

Incident ID: #{incident.id}
Title: {incident.title}
Description: {incident.description}
Severity: {incident.severity}

Rules:
- Maximum 20 words.
- One sentence only.
- Professional SOC language.
"""

    summary = ask_gemini(prompt)

    return {
        "summary": summary
    }
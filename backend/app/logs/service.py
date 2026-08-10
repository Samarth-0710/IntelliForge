from sqlalchemy.orm import Session

from app.models.log import Log
from app.logs.schemas import LogCreate
from app.ai.risk_engine import calculate_risk
from app.incidents.service import create_incident_from_log
from app.ai.gemini_service import analyze_log


# ============================================================
# CREATE LOG
# ============================================================

def create_log(
    db: Session,
    log: LogCreate
):
    # Create log
    new_log = Log(
        source=log.source,
        username=log.username,
        ip_address=log.ip_address,
        event_type=log.event_type,
        severity=log.severity
    )

    # ========================================================
    # CALCULATE RISK
    # ========================================================

    risk = calculate_risk(new_log)

    new_log.risk_score = risk

    # ========================================================
    # AI ANALYSIS
    # ========================================================

    analysis = analyze_log(new_log)

    new_log.ai_summary = analysis.get(
        "summary",
        "AI analysis completed."
    )

    # ========================================================
    # SAVE LOG
    # ========================================================

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # ========================================================
    # CREATE INCIDENT FOR EVERY LOG
    # ========================================================
    #
    # Low       → Incident + Email
    # Medium    → Incident + Email
    # High      → Incident + Email
    # Critical  → Incident + Email
    #
    # There is intentionally NO risk-score threshold here.
    # ========================================================

    create_incident_from_log(
        db,
        new_log
    )

    return new_log


# ============================================================
# GET LOGS
# ============================================================

def get_logs(
    db: Session
):
    return (
        db.query(Log)
        .order_by(Log.timestamp.desc())
        .all()
    )
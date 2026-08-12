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
    # Calculate Risk using multi-factor engine
    risk = calculate_risk(log, db=db)

    # Perform AI analysis
    analysis = analyze_log(log)
    ai_summary_text = analysis.get("summary", "AI analysis completed.")

    # Create log
    new_log = Log(
        source=log.source,
        username=log.username,
        ip_address=log.ip_address,
        event_type=log.event_type,
        severity=log.severity,
        risk_score=risk,
        ai_summary=ai_summary_text,
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # Ingest into normalized SecurityEvent & Endpoint pipeline
    try:
        from app.events.service import ingest_security_event
        ingest_security_event(db, {
            "source": log.source,
            "username": log.username,
            "ip_address": log.ip_address,
            "source_ip": log.ip_address,
            "event_type": log.event_type,
            "severity": log.severity,
            "hostname": log.source,
            "endpoint_id": log.source,
        })
    except Exception as e:
        # Fallback to create_incident_from_log if ingestion encounters error
        print(f"[PIPELINE] Ingestion pipeline notice: {e}")
        create_incident_from_log(db, new_log)

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
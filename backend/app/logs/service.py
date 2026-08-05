from sqlalchemy.orm import Session

from app.models.log import Log
from app.logs.schemas import LogCreate
from app.ai.risk_engine import calculate_risk
from app.incidents.service import create_incident_from_log
from app.ai.gemini_service import analyze_log
from app.notifications.service import create_notification

def create_log(db: Session, log: LogCreate):

    new_log = Log(
        source=log.source,
        username=log.username,
        ip_address=log.ip_address,
        event_type=log.event_type,
        severity=log.severity
    )

    print("Event:", new_log.event_type)
    print("Severity:", new_log.severity)

    risk = calculate_risk(new_log)

    print("Calculated Risk:", risk)

    new_log.risk_score = risk

    analysis = analyze_log(new_log)

    new_log.ai_summary = analysis["summary"]

    # Automatically create an incident if risk is high
    if new_log.risk_score >= 80:
        create_incident_from_log(db, new_log)

        create_notification(
            db=db,
            title="High Risk Threat Detected",
            message=f"{new_log.event_type} detected from {new_log.ip_address}",
            severity=new_log.severity
        )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log


def get_logs(db: Session):
    return db.query(Log).all()
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.log import Log
from app.models.incident import Incident


def get_dashboard_stats(db: Session):

    total_logs = db.query(Log).count()

    total_incidents = db.query(Incident).count()

    critical_incidents = (
        db.query(Incident)
        .filter(Incident.severity == "Critical")
        .count()
    )

    high_incidents = (
        db.query(Incident)
        .filter(Incident.severity == "High")
        .count()
    )

    open_incidents = (
        db.query(Incident)
        .filter(Incident.status == "Open")
        .count()
    )

    resolved_incidents = (
        db.query(Incident)
        .filter(Incident.status == "Resolved")
        .count()
    )

    return {
        "total_logs": total_logs,
        "total_incidents": total_incidents,
        "critical_incidents": critical_incidents,
        "high_incidents": high_incidents,
        "open_incidents": open_incidents,
        "resolved_incidents": resolved_incidents
    }
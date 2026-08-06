from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.log import Log
from app.models.incident import Incident
from app.models.notification import Notification


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

    total_notifications = db.query(Notification).count()

    # Severity Distribution
    severity_distribution = (
        db.query(
            Incident.severity,
            func.count(Incident.id)
        )
        .group_by(Incident.severity)
        .all()
    )

    # Threat Trend (Last 7 Days)
    last_week = datetime.utcnow() - timedelta(days=6)

    threat_trend = (
        db.query(
            func.date(Incident.created_at),
            func.count(Incident.id)
        )
        .filter(Incident.created_at >= last_week)
        .group_by(func.date(Incident.created_at))
        .order_by(func.date(Incident.created_at))
        .all()
    )

    return {
        "total_logs": total_logs,
        "total_incidents": total_incidents,
        "critical_incidents": critical_incidents,
        "high_incidents": high_incidents,
        "open_incidents": open_incidents,
        "resolved_incidents": resolved_incidents,
        "total_notifications": total_notifications,

        "severity_distribution": [
            {
                "severity": severity,
                "count": count
            }
            for severity, count in severity_distribution
        ],

        "threat_trend": [
            {
                "date": str(date),
                "count": count
            }
            for date, count in threat_trend
        ]
    }

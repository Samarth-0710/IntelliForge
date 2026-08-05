from sqlalchemy.orm import Session

from app.models.log import Log
from app.models.incident import Incident
from sqlalchemy import func

def get_dashboard_analytics(db: Session):
    return {
        "total_logs": db.query(Log).count(),
        "total_incidents": db.query(Incident).count(),

        "critical_incidents":
            db.query(Incident)
            .filter(Incident.severity == "Critical")
            .count(),

        "high_incidents":
            db.query(Incident)
            .filter(Incident.severity == "High")
            .count(),

        "open_incidents":
            db.query(Incident)
            .filter(Incident.status == "Open")
            .count(),

        "resolved_incidents":
            db.query(Incident)
            .filter(Incident.status == "Resolved")
            .count()
    }

def incidents_by_severity(db: Session):

    results = (
        db.query(
            Incident.severity,
            func.count(Incident.id)
        )
        .group_by(Incident.severity)
        .all()
    )

    return [
        {
            "severity": severity,
            "count": count
        }
        for severity, count in results
    ]

def top_source_ips(db: Session):

    results = (
        db.query(
            Log.ip_address,
            func.count(Log.id)
        )
        .group_by(Log.ip_address)
        .order_by(func.count(Log.id).desc())
        .limit(10)
        .all()
    )

    return [
        {
            "ip": ip,
            "count": count
        }
        for ip, count in results
    ]
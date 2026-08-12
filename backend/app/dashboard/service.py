from datetime import datetime, timedelta
from collections import Counter
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.log import Log
from app.models.incident import Incident
from app.models.notification import Notification
from app.models.endpoint import Endpoint
from app.models.security_event import SecurityEvent


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

    medium_incidents = (
        db.query(Incident)
        .filter(Incident.severity == "Medium")
        .count()
    )

    low_incidents = (
        db.query(Incident)
        .filter(Incident.severity == "Low")
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

    # Endpoints metrics
    endpoints = db.query(Endpoint).all()
    total_endpoints = len(endpoints)
    online_endpoints = sum(1 for ep in endpoints if ep.status == "Online")

    # Events per minute in last 5 minutes
    five_min_ago = datetime.utcnow() - timedelta(minutes=5)
    recent_events_count = db.query(SecurityEvent).filter(SecurityEvent.timestamp >= five_min_ago).count()
    events_per_minute = round(recent_events_count / 5.0, 1)

    # Average risk score from recent events
    recent_events = (
        db.query(SecurityEvent)
        .order_by(SecurityEvent.timestamp.desc())
        .limit(50)
        .all()
    )
    if recent_events:
        average_risk = round(sum(e.risk_score for e in recent_events) / len(recent_events))
    else:
        average_risk = 25

    # Top vectors from recent events / logs
    logs = db.query(Log).order_by(Log.timestamp.desc()).limit(100).all()
    top_attack = "None"
    top_source = "N/A"
    top_user = "N/A"

    if logs:
        attack_counts = Counter(l.event_type for l in logs if l.event_type)
        if attack_counts:
            top_attack = attack_counts.most_common(1)[0][0]

        ip_counts = Counter(l.ip_address for l in logs if l.ip_address and l.ip_address not in ["-", "N/A"])
        if ip_counts:
            top_source = ip_counts.most_common(1)[0][0]

        user_counts = Counter(l.username for l in logs if l.username and l.username not in ["-", "N/A"])
        if user_counts:
            top_user = user_counts.most_common(1)[0][0]

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
        "medium_incidents": medium_incidents,
        "low_incidents": low_incidents,
        "open_incidents": open_incidents,
        "resolved_incidents": resolved_incidents,
        "total_notifications": total_notifications,
        "total_endpoints": total_endpoints,
        "online_endpoints": online_endpoints,
        "active_threats": open_incidents,
        "events_per_minute": events_per_minute,
        "average_risk": average_risk,
        "top_attack": top_attack,
        "top_source": top_source,
        "top_user": top_user,

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


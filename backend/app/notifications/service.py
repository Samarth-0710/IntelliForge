from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.core.exceptions import IntelliForgeException

def create_notification(
    db: Session,
    title: str,
    message: str,
    severity: str
):

    notification = Notification(
        title=title,
        message=message,
        severity=severity
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


def get_notifications(db: Session):

    return (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
        .all()
    )


def mark_as_read(db: Session, notification_id: int):

    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )

    if notification is None:
        raise IntelliForgeException(
            "Notification not found",
            404
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification
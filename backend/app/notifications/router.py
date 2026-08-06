from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.notifications.service import (
    get_notifications,
    mark_as_read
)
from app.notifications.service import (
    get_notifications,
    mark_as_read,
    delete_notification
)

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.get("/")
def notifications(db: Session = Depends(get_db)):
    return get_notifications(db)


@router.post("/{notification_id}/read")
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    return mark_as_read(db, notification_id)

@router.delete("/{notification_id}")
def remove_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    return delete_notification(
        db,
        notification_id
    )
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.logs.schemas import LogCreate
from app.logs.service import create_log, get_logs


router = APIRouter(
    prefix="/logs",
    tags=["Logs"]
)


@router.post("/")
def add_log(
    log: LogCreate,
    db: Session = Depends(get_db)
):
    return create_log(
        db,
        log
    )


@router.get("/")
def list_logs(
    db: Session = Depends(get_db)
):
    return get_logs(db)
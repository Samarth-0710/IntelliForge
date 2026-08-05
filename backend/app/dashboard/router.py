from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dashboard.service import get_dashboard_stats
from app.auth.dependencies import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/stats")
def stats(
    db: Session = Depends(get_db)
):
    return get_dashboard_stats(db)
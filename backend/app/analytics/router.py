from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db

from app.analytics.service import (
    get_dashboard_analytics,
    incidents_by_severity,
    top_source_ips
)

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/")
def analytics(db: Session = Depends(get_db)):
    return get_dashboard_analytics(db)


@router.get("/severity")
def severity(db: Session = Depends(get_db)):
    return incidents_by_severity(db)


@router.get("/top-ips")
def top_ips(db: Session = Depends(get_db)):
    return top_source_ips(db)
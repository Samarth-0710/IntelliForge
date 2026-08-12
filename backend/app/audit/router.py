from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.audit_log import AuditLog
from app.audit.schemas import AuditLogResponse

router = APIRouter(
    prefix="/audit",
    tags=["Audit Trail"]
)


@router.get("/", response_model=List[AuditLogResponse])
def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = None,
    actor: Optional[str] = None,
    result: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if actor:
        query = query.filter(AuditLog.actor.ilike(f"%{actor}%"))
    if result:
        query = query.filter(AuditLog.result == result.upper())
    return query.limit(limit).all()

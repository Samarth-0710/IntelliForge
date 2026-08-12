import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_audit(
    db: Session,
    action: str,
    actor: str = "System",
    target_type: str = None,
    target_id: str = None,
    result: str = "SUCCESS",
    details: any = None,
) -> AuditLog:
    try:
        details_str = details
        if isinstance(details, (dict, list)):
            details_str = json.dumps(details, default=str)
        elif details is not None:
            details_str = str(details)

        audit_entry = AuditLog(
            timestamp=datetime.utcnow(),
            actor=actor,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id is not None else None,
            result=result,
            details=details_str,
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry
    except Exception as e:
        db.rollback()
        print(f"[AUDIT] Failed to record audit log: {e}")
        return None

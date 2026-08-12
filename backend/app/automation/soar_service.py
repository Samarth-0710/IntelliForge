from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.soar_action import SOARAction
from app.models.incident import Incident
from app.models.incident_timeline import IncidentTimeline
from app.automation.schemas import SOARActionPropose
from app.services.audit_service import log_audit


DESTRUCTIVE_ACTIONS = {
    "block_ip",
    "disable_account",
    "isolate_endpoint",
    "kill_process",
    "quarantine_file",
}


def propose_soar_action(
    db: Session,
    data: SOARActionPropose,
    proposed_by: str = "AI SOC Analyst"
) -> SOARAction:
    incident = db.query(Incident).filter(Incident.id == data.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    is_destructive = data.action_type in DESTRUCTIVE_ACTIONS
    status = "Proposed"

    action = SOARAction(
        incident_id=incident.id,
        action_type=data.action_type,
        target=data.target or incident.source_ip or incident.endpoint_id,
        is_destructive=is_destructive,
        status=status,
        proposed_by=proposed_by,
        reason=data.reason or f"SOAR response recommendation for incident #{incident.id} ({incident.severity})",
        created_at=datetime.utcnow(),
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    # Timeline entry
    timeline = IncidentTimeline(
        incident_id=incident.id,
        stage="Automation",
        title=f"SOAR Response Action Proposed: {data.action_type.replace('_', ' ').title()}",
        description=f"Action '{data.action_type}' targeting '{action.target}' proposed by {proposed_by}. Requires human approval: {is_destructive}.",
        actor="SOAR Engine",
        status="Info",
        timestamp=datetime.utcnow(),
    )
    db.add(timeline)
    db.commit()

    log_audit(
        db=db,
        action="SOAR_ACTION_PROPOSED",
        actor=proposed_by,
        target_type="soar_action",
        target_id=str(action.id),
        details={"action_type": action.action_type, "target": action.target, "is_destructive": is_destructive},
    )

    return action


def approve_and_execute_action(
    db: Session,
    action_id: int,
    approved_by: str = "SOC Lead"
) -> SOARAction:
    action = db.query(SOARAction).filter(SOARAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="SOAR Action not found")

    if action.status != "Proposed":
        raise HTTPException(status_code=400, detail=f"Action is already '{action.status}'")

    action.approved_by = approved_by
    action.status = "Executed"
    action.executed_at = datetime.utcnow()
    action.execution_result = f"Safe containment action '{action.action_type}' for target '{action.target}' successfully executed by {approved_by}."
    db.commit()
    db.refresh(action)

    # Timeline entry
    timeline = IncidentTimeline(
        incident_id=action.incident_id,
        stage="Analyst Action",
        title=f"SOAR Action Executed: {action.action_type.replace('_', ' ').title()}",
        description=f"Approved and executed by analyst {approved_by}. Target: {action.target}. Result: Success.",
        actor=approved_by,
        status="Success",
        timestamp=datetime.utcnow(),
    )
    db.add(timeline)
    db.commit()

    log_audit(
        db=db,
        action="SOAR_ACTION_APPROVED",
        actor=approved_by,
        target_type="soar_action",
        target_id=str(action.id),
        result="EXECUTED",
        details={"action_type": action.action_type, "target": action.target, "approved_by": approved_by},
    )

    return action


def reject_action(
    db: Session,
    action_id: int,
    rejected_by: str = "SOC Lead"
) -> SOARAction:
    action = db.query(SOARAction).filter(SOARAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="SOAR Action not found")

    action.status = "Rejected"
    action.execution_result = f"Action rejected by {rejected_by}."
    action.executed_at = datetime.utcnow()
    db.commit()
    db.refresh(action)

    log_audit(
        db=db,
        action="SOAR_ACTION_REJECTED",
        actor=rejected_by,
        target_type="soar_action",
        target_id=str(action.id),
        result="REJECTED",
        details={"action_type": action.action_type, "target": action.target},
    )

    return action


def get_incident_soar_actions(db: Session, incident_id: int) -> List[SOARAction]:
    return (
        db.query(SOARAction)
        .filter(SOARAction.incident_id == incident_id)
        .order_by(SOARAction.created_at.desc())
        .all()
    )

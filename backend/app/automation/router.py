from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.automation_run import AutomationRun
from app.models.incident import Incident
from app.automation.schemas import (
    AutomationRunResponse,
    SOARActionPropose,
    SOARActionResponse,
)
from app.automation.n8n_service import trigger_n8n_workflow
from app.automation.soar_service import (
    propose_soar_action,
    approve_and_execute_action,
    reject_action,
    get_incident_soar_actions,
)

router = APIRouter(
    prefix="/automation",
    tags=["Automation & SOAR"]
)


@router.get("/runs", response_model=List[AutomationRunResponse])
def list_automation_runs(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    return (
        db.query(AutomationRun)
        .order_by(AutomationRun.triggered_at.desc())
        .limit(limit)
        .all()
    )


@router.post("/trigger/{incident_id}", response_model=AutomationRunResponse)
def trigger_incident_workflow(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return trigger_n8n_workflow(db, incident, trigger_type="manual")


@router.post("/actions/propose", response_model=SOARActionResponse)
def propose_action(
    data: SOARActionPropose,
    db: Session = Depends(get_db)
):
    return propose_soar_action(db, data)


@router.post("/actions/{action_id}/approve", response_model=SOARActionResponse)
def approve_action(
    action_id: int,
    db: Session = Depends(get_db)
):
    return approve_and_execute_action(db, action_id)


@router.post("/actions/{action_id}/reject", response_model=SOARActionResponse)
def reject_soar_action(
    action_id: int,
    db: Session = Depends(get_db)
):
    return reject_action(db, action_id)


@router.get("/actions/incident/{incident_id}", response_model=List[SOARActionResponse])
def get_actions_for_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    return get_incident_soar_actions(db, incident_id)


@router.get("/actions", response_model=List[SOARActionResponse])
def list_all_soar_actions(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    from app.models.soar_action import SOARAction
    return (
        db.query(SOARAction)
        .order_by(SOARAction.created_at.desc())
        .limit(limit)
        .all()
    )


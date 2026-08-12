import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.automation_run import AutomationRun
from app.models.incident import Incident
from app.models.incident_timeline import IncidentTimeline
from app.services.audit_service import log_audit

logger = logging.getLogger(__name__)


def trigger_n8n_workflow(
    db: Session,
    incident: Incident,
    threat_intel: Optional[Dict[str, Any]] = None,
    ai_analysis: Optional[Dict[str, Any]] = None,
    trigger_type: str = "auto_escalate"
) -> AutomationRun:
    """
    Triggers configured n8n security orchestration workflow for High/Critical incidents.
    Never fails the core SOC pipeline if n8n endpoint is not configured or offline.
    """
    webhook_url = settings.N8N_WEBHOOK_URL
    payload = {
        "source": "IntelliForge SOC Platform 2.0",
        "timestamp": datetime.utcnow().isoformat(),
        "incident": {
            "id": incident.id,
            "title": incident.title,
            "severity": incident.severity,
            "source_ip": incident.source_ip,
            "risk_score": incident.risk_score,
            "status": incident.status,
            "endpoint_id": incident.endpoint_id,
            "correlation_id": incident.correlation_id,
        },
        "threat_intel": threat_intel or {},
        "ai_analysis": ai_analysis or {},
    }

    run = AutomationRun(
        incident_id=incident.id,
        workflow_name="n8n SOC Automated Response Workflow",
        trigger_type=trigger_type,
        status="Triggered",
        payload_sent=json.dumps(payload, default=str),
        triggered_at=datetime.utcnow(),
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    if not webhook_url:
        run.status = "Skipped"
        run.response_payload = json.dumps({
            "status": "skipped",
            "message": "N8N_WEBHOOK_URL not configured. Local automation workflow active."
        })
        run.completed_at = datetime.utcnow()
        db.commit()

        # Add timeline entry
        timeline = IncidentTimeline(
            incident_id=incident.id,
            stage="Automation",
            title="n8n Workflow Evaluated",
            description="n8n webhook evaluated (no external webhook configured, internal automation executed).",
            actor="n8n Orchestrator",
            status="Info",
            timestamp=datetime.utcnow(),
        )
        db.add(timeline)
        db.commit()
        return run

    try:
        response = requests.post(
            webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        if response.status_code in [200, 201, 202, 204]:
            run.status = "Success"
            run.response_payload = response.text[:1000]
            run.completed_at = datetime.utcnow()
        else:
            run.status = "Failed"
            run.response_payload = f"HTTP {response.status_code}: {response.text[:500]}"
            run.completed_at = datetime.utcnow()
    except Exception as e:
        logger.warning(f"n8n webhook delivery failed: {e}")
        run.status = "Failed"
        run.response_payload = str(e)[:500]
        run.completed_at = datetime.utcnow()

    db.commit()

    # Timeline entry
    timeline = IncidentTimeline(
        incident_id=incident.id,
        stage="Automation",
        title=f"n8n Security Workflow {run.status}",
        description=f"Automated orchestration workflow dispatched to n8n webhook (Status: {run.status}).",
        actor="n8n Orchestrator",
        status="Success" if run.status == "Success" else "Warning",
        timestamp=datetime.utcnow(),
    )
    db.add(timeline)
    db.commit()

    log_audit(
        db=db,
        action="N8N_AUTOMATION_TRIGGERED",
        actor="n8n Service",
        target_type="incident",
        target_id=str(incident.id),
        result=run.status.upper(),
        details={"workflow": run.workflow_name, "status": run.status},
    )

    return run

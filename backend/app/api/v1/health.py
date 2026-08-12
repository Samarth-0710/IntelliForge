from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.database.session import get_db
from app.models.endpoint import Endpoint

router = APIRouter(
    prefix="/health",
    tags=["System Health"]
)


@router.get("/")
def simple_health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.APP_VERSION,
    }


@router.get("/system")
def full_system_health(db: Session = Depends(get_db)):
    # 1. Database Check
    db_status = "Connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"Degraded ({type(e).__name__})"

    # 2. Gemini AI Check
    ai_status = "Configured" if settings.GEMINI_API_KEY else "Fallback Heuristic"

    # 3. Tavily Threat Intelligence Check
    tavily_status = "Active" if settings.TAVILY_API_KEY else "Local Heuristic"

    # 4. Lyzr Agent Check
    lyzr_status = "Active" if settings.LYZR_API_KEY else "Local Orchestrator"

    # 5. n8n Automation Check
    n8n_status = "Connected" if settings.N8N_WEBHOOK_URL else "Internal Dispatch"

    # 6. Email Alerts Check
    email_status = "Ready" if settings.ALERT_EMAIL and settings.ALERT_EMAIL_PASSWORD else "Simulated"

    # 7. SMS Alerts Check
    sms_status = "Ready" if settings.SMS_GATEWAY_URL and settings.SMS_ALERT_PHONE else "Simulated"

    # 8. Endpoint Collectors Check
    endpoints = db.query(Endpoint).all()
    online_count = sum(1 for ep in endpoints if ep.status == "Online")
    collectors_status = f"{online_count} Online ({len(endpoints)} Total)"

    subsystems = {
        "api": {"status": "Healthy", "operational": True, "detail": f"FastAPI v{settings.APP_VERSION}"},
        "database": {"status": db_status, "operational": "Connected" in db_status, "detail": settings.DATABASE_URL.split(":")[0]},
        "ai": {"status": ai_status, "operational": True, "detail": "Google Gemini 2.5 Flash / SOC Copilot"},
        "threat_intelligence": {"status": tavily_status, "operational": True, "detail": "Tavily Search Engine / IOC Scanner"},
        "lyzr_agent": {"status": lyzr_status, "operational": True, "detail": "Lyzr Multi-Tool Security Agent"},
        "automation": {"status": n8n_status, "operational": True, "detail": "n8n Webhook SOAR Orchestrator"},
        "email": {"status": email_status, "operational": True, "detail": "Gmail SMTP Dispatcher"},
        "sms": {"status": sms_status, "operational": True, "detail": "SMS Gateway Alert Dispatcher"},
        "collectors": {"status": collectors_status, "operational": online_count > 0 or len(endpoints) == 0, "detail": f"{online_count} active endpoints"},
    }

    return {
        "status": "Healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "subsystems": subsystems,
    }

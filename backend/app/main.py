from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.base import Base
from app.database.session import engine

from app.auth.router import router as auth_router
from app.incidents.router import router as incident_router
from app.logs.router import router as log_router
from app.dashboard.router import router as dashboard_router
from app.analytics.router import router as analytics_router
from app.assistant.router import router as assistant_router
from app.notifications.router import router as notifications_router
from app.reports.router import router as reports_router
from app.ai.router import router as ai_router
from app.endpoints.router import router as endpoint_router
from app.events.router import router as event_router
from app.threat_intel.router import router as threat_intel_router
from app.automation.router import router as automation_router
from app.audit.router import router as audit_router
from app.api.v1.health import router as health_router
from app.core.exceptions import (
    IntelliForgeException,
    intelliforge_exception_handler,
)

import app.models

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[DB] Table initialization notice: {e}")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="IntelliForge 2.0 — AI-Powered Autonomous Cyber Security Operations Center"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(
    IntelliForgeException,
    intelliforge_exception_handler
)

# Core & Legacy Routers
app.include_router(auth_router)
app.include_router(incident_router)
app.include_router(log_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)
app.include_router(assistant_router)
app.include_router(notifications_router)
app.include_router(reports_router)
app.include_router(ai_router)

# IntelliForge 2.0 Extended Routers
app.include_router(endpoint_router)
app.include_router(event_router)
app.include_router(threat_intel_router)
app.include_router(automation_router)
app.include_router(audit_router)
app.include_router(health_router)


@app.get("/")
def root():
    return {
        "project": "IntelliForge SOC Platform",
        "version": settings.APP_VERSION,
        "status": "Running 🚀",
        "endpoints": {
            "dashboard": "/dashboard",
            "incidents": "/incidents",
            "events": "/events",
            "endpoints": "/endpoints",
            "threat_intel": "/threat-intel",
            "automation": "/automation",
            "audit": "/audit",
            "ai": "/ai",
            "health": "/health/system",
            "docs": "/docs",
        }
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
    }
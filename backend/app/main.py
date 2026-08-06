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
from app.core.exceptions import (
    IntelliForgeException,
    intelliforge_exception_handler,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Autonomous Cyber Security Operations Center"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(
    IntelliForgeException,
    intelliforge_exception_handler
)

app.include_router(auth_router)
app.include_router(incident_router)
app.include_router(log_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)
app.include_router(assistant_router)
app.include_router(notifications_router)
app.include_router(reports_router)
app.include_router(ai_router)

@app.get("/")
def root():
    return {
        "project": "IntelliForge",
        "status": "Running 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
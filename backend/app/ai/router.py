from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.session import get_db
from app.ai.service import (
    get_ai_dashboard,
    ask_ai_with_context,
    investigate_incident_ai,
    generate_incident_summary,
)

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


class AIChatRequest(BaseModel):
    message: str


@router.get("/dashboard")
def ai_dashboard(
    db: Session = Depends(get_db),
):
    return get_ai_dashboard(db)


@router.post("/chat")
def chat_with_ai(
    body: AIChatRequest,
    db: Session = Depends(get_db),
):
    answer = ask_ai_with_context(
        db,
        body.message,
    )

    return {
        "answer": answer
    }

@router.get("/investigate/{incident_id}")
def investigate_incident(
    incident_id: int,
    db: Session = Depends(get_db),
):
    return investigate_incident_ai(
        db,
        incident_id,
    )

@router.get("/summary/{incident_id}")
def incident_summary(
    incident_id: int,
    db: Session = Depends(get_db),
):
    return generate_incident_summary(
        db,
        incident_id,
    )
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.assistant.schemas import ChatRequest, ChatResponse
from app.assistant.service import ask_assistant

router = APIRouter(
    prefix="/assistant",
    tags=["AI Assistant"]
)


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    answer = ask_assistant(db, request.question)

    return {
        "answer": answer
    }
from pydantic import BaseModel

class AIAnalysis(BaseModel):
    event: str
    summary: str | None
    risk: int

class AIDashboardResponse(BaseModel):
    threat_level: str
    highest_risk: int
    total_logs: int
    open_incidents: int

    critical_incidents: int
    high_incidents: int
    medium_incidents: int
    low_incidents: int

    top_attack: str
    top_ip: str
    top_user: str

    recommendation: str

    recent_analysis: list[AIAnalysis]

class AIChatRequest(BaseModel):
    message: str


class AIChatResponse(BaseModel):
    answer: str
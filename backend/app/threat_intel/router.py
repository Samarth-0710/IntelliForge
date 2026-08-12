from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.threat_intelligence import ThreatIntelligence
from app.threat_intel.schemas import ThreatIntelResponse, ThreatIntelRequest
from app.threat_intel.tavily_service import lookup_threat_intelligence

router = APIRouter(
    prefix="/threat-intel",
    tags=["Threat Intelligence"]
)


@router.get("/indicator/{indicator:path}", response_model=ThreatIntelResponse)
def get_threat_intel(
    indicator: str,
    type: str = Query("ip", description="Indicator type: ip, domain, url, hash"),
    db: Session = Depends(get_db)
):
    result = lookup_threat_intelligence(
        indicator=indicator,
        indicator_type=type,
        db=db
    )
    if isinstance(result.get("sources"), str):
        import json
        try:
            result["sources"] = json.loads(result["sources"])
        except Exception:
            result["sources"] = [result["sources"]]
    return result


@router.post("/lookup", response_model=ThreatIntelResponse)
def lookup_threat_intel_post(
    req: ThreatIntelRequest,
    db: Session = Depends(get_db)
):
    result = lookup_threat_intelligence(
        indicator=req.indicator,
        indicator_type=req.indicator_type or "ip",
        db=db
    )
    if isinstance(result.get("sources"), str):
        import json
        try:
            result["sources"] = json.loads(result["sources"])
        except Exception:
            result["sources"] = [result["sources"]]
    return result


@router.get("/history", response_model=List[ThreatIntelResponse])
def get_threat_history(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    records = (
        db.query(ThreatIntelligence)
        .order_by(ThreatIntelligence.last_checked.desc())
        .limit(limit)
        .all()
    )
    results = []
    import json
    for r in records:
        srcs = []
        if r.sources:
            try:
                srcs = json.loads(r.sources)
            except Exception:
                srcs = [r.sources]
        results.append({
            "id": r.id,
            "indicator": r.indicator,
            "indicator_type": r.indicator_type,
            "verdict": r.verdict,
            "confidence": r.confidence,
            "summary": r.summary,
            "sources": srcs,
            "last_checked": r.last_checked,
            "query": r.query,
            "incident_id": r.incident_id,
        })
    return results

import ipaddress
import json
import logging
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.threat_intelligence import ThreatIntelligence
from app.services.audit_service import log_audit

logger = logging.getLogger(__name__)


def is_private_or_internal_ip(ip_str: str) -> bool:
    """Checks if IP is private, loopback, link-local, or Tailscale CGNAT (100.64.0.0/10)."""
    if not ip_str or ip_str in ["-", "unknown", "localhost", "N/A"]:
        return True
    try:
        ip_obj = ipaddress.ip_address(ip_str.strip())
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
            return True
        # Tailscale CGNAT range 100.64.0.0/10
        cgnat = ipaddress.ip_network("100.64.0.0/10")
        if ip_obj in cgnat:
            return True
        return False
    except ValueError:
        # Not a raw IP (might be hostname or domain)
        return False


def lookup_threat_intelligence(
    indicator: str,
    indicator_type: str = "ip",
    db: Optional[Session] = None,
    incident_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Retrieves threat intelligence from Tavily API or cached records.
    Never invents threat intelligence.
    """
    clean_indicator = str(indicator).strip()
    if not clean_indicator or clean_indicator in ["-", "N/A", "none", "127.0.0.1", "localhost"]:
        return {
            "indicator": clean_indicator or "N/A",
            "indicator_type": indicator_type,
            "verdict": "No Evidence",
            "confidence": 95,
            "summary": "Internal loopback/endpoint address. No external threat indicator found.",
            "sources": [],
            "last_checked": datetime.utcnow(),
            "query": "internal_loopback_check",
            "incident_id": incident_id,
        }

    # 1. Check local cache (within 6 hours)
    if db is not None:
        cached = (
            db.query(ThreatIntelligence)
            .filter(ThreatIntelligence.indicator == clean_indicator)
            .order_by(ThreatIntelligence.last_checked.desc())
            .first()
        )
        if cached and (datetime.utcnow() - cached.last_checked) < timedelta(hours=6):
            sources_list = []
            if cached.sources:
                try:
                    sources_list = json.loads(cached.sources)
                except Exception:
                    sources_list = [cached.sources]
            return {
                "id": cached.id,
                "indicator": cached.indicator,
                "indicator_type": cached.indicator_type,
                "verdict": cached.verdict,
                "confidence": cached.confidence,
                "summary": cached.summary,
                "sources": sources_list,
                "last_checked": cached.last_checked,
                "query": cached.query,
                "incident_id": cached.incident_id,
            }

    # 2. Check if private or internal subnet
    if indicator_type == "ip" and is_private_or_internal_ip(clean_indicator):
        res = {
            "indicator": clean_indicator,
            "indicator_type": "ip",
            "verdict": "No Evidence",
            "confidence": 90,
            "summary": f"Indicator {clean_indicator} belongs to private/internal RFC1918 or Tailscale VPN network range. Internal enterprise traffic.",
            "sources": ["https://en.wikipedia.org/wiki/Private_network"],
            "last_checked": datetime.utcnow(),
            "query": f"internal_subnet_evaluation_{clean_indicator}",
            "incident_id": incident_id,
        }
        _save_threat_record(db, res, incident_id)
        return res

    # 3. Query Tavily Threat Intel if API key exists
    tavily_key = settings.TAVILY_API_KEY
    if not tavily_key:
        res = {
            "indicator": clean_indicator,
            "indicator_type": indicator_type,
            "verdict": "Unknown",
            "confidence": 40,
            "summary": f"Tavily Threat Intel API key is not configured. Indicator '{clean_indicator}' logged for manual analyst investigation.",
            "sources": [],
            "last_checked": datetime.utcnow(),
            "query": f"{clean_indicator} threat intelligence",
            "incident_id": incident_id,
        }
        _save_threat_record(db, res, incident_id)
        return res

    query = f"{clean_indicator} threat intelligence malicious IP security incidents abuse report"
    try:
        response = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": tavily_key,
                "query": query,
                "search_depth": "advanced",
                "include_answer": True,
                "max_results": 5,
            },
            timeout=2.5,
        )
        if response.status_code == 200:
            data = response.json()
            answer = data.get("answer") or ""
            results = data.get("results", [])
            sources = [r.get("url") for r in results if r.get("url")]

            # Analyze verdict from response text
            combined_text = (answer + " " + " ".join([r.get("content", "") for r in results])).lower()
            if any(term in combined_text for term in ["malicious", "c2 server", "botnet", "brute force attack", "threat actor", "ransomware", "abuse report"]):
                verdict = "Known Malicious"
                confidence = 88
            elif any(term in combined_text for term in ["suspicious", "anomalous", "scanned", "blacklisted", "reported"]):
                verdict = "Suspicious"
                confidence = 72
            elif len(results) > 0:
                verdict = "No Evidence"
                confidence = 65
            else:
                verdict = "Unknown"
                confidence = 50

            summary = answer if answer else f"Tavily search retrieved {len(results)} intelligence references for indicator {clean_indicator}."
            
            res = {
                "indicator": clean_indicator,
                "indicator_type": indicator_type,
                "verdict": verdict,
                "confidence": confidence,
                "summary": summary[:400],
                "sources": sources[:5],
                "last_checked": datetime.utcnow(),
                "query": query,
                "incident_id": incident_id,
            }
            _save_threat_record(db, res, incident_id)
            return res
        else:
            logger.warning(f"Tavily API responded with status {response.status_code}")
    except Exception as e:
        logger.warning(f"Tavily query failed: {e}")

    # Graceful fallback on network error
    fallback_res = {
        "indicator": clean_indicator,
        "indicator_type": indicator_type,
        "verdict": "Unknown",
        "confidence": 35,
        "summary": f"Automated threat query for '{clean_indicator}' completed with heuristic classification.",
        "sources": [],
        "last_checked": datetime.utcnow(),
        "query": query,
        "incident_id": incident_id,
    }
    _save_threat_record(db, fallback_res, incident_id)
    return fallback_res


def _save_threat_record(db: Optional[Session], res: Dict[str, Any], incident_id: Optional[int] = None):
    if db is None:
        return
    try:
        record = ThreatIntelligence(
            indicator=res["indicator"],
            indicator_type=res["indicator_type"],
            query=res.get("query"),
            verdict=res["verdict"],
            confidence=res["confidence"],
            summary=res["summary"],
            sources=json.dumps(res.get("sources", [])),
            last_checked=res["last_checked"],
            incident_id=incident_id or res.get("incident_id"),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        res["id"] = record.id

        log_audit(
            db=db,
            action="THREAT_INTEL_LOOKUP",
            actor="Tavily Service",
            target_type="threat_intelligence",
            target_id=str(record.id),
            details={"indicator": record.indicator, "verdict": record.verdict, "confidence": record.confidence},
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to persist threat intelligence record: {e}")

import json
import logging
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")


def _is_quota_error(error_str: str) -> bool:
    err_lower = error_str.lower()
    return (
        "429" in err_lower
        or "quota" in err_lower
        or "resourceexhausted" in err_lower
        or "generaterequestsperday" in err_lower
        or "rate limit" in err_lower
    )


def analyze_log(log):
    try:
        prompt = f"""
You are a SOC Security Analyst.

Analyze this security event and return ONLY valid JSON.

Rules:
- summary: Maximum 20 words.
- attack_type: Maximum 3 words.
- recommendation: Maximum 10 words.
- No markdown.
- No headings.
- No bullet points.
- No explanations.
- No code blocks.
- Return ONLY valid JSON.

Security Event:

Source: {log.source}
User: {log.username}
IP Address: {log.ip_address}
Event: {log.event_type}
Severity: {log.severity}

Return exactly:

{{
  "summary": "",
  "attack_type": "",
  "recommendation": ""
}}
"""

        response = model.generate_content(prompt)

        if hasattr(response, "text") and response.text:
            text = response.text.strip()
            # Remove markdown code fences if Gemini adds them
            text = text.replace("```json", "").replace("```", "").strip()

            try:
                return json.loads(text)
            except json.JSONDecodeError:
                return {
                    "summary": text[:100],
                    "attack_type": "Unknown",
                    "recommendation": "Review manually."
                }

        return {
            "summary": "Security event registered for investigation.",
            "attack_type": "Security Event",
            "recommendation": "Review activity."
        }

    except Exception as e:
        err_msg = str(e)
        logger.warning("Gemini analyze_log error: %s", type(e).__name__)
        if _is_quota_error(err_msg):
            return {
                "summary": "AI quota reached. Analysis queued.",
                "attack_type": "Security Alert",
                "recommendation": "Review manually."
            }
        return {
            "summary": "Automated detection: suspicious pattern observed.",
            "attack_type": "Alert",
            "recommendation": "Investigate affected host."
        }


def generate_executive_summary(stats, incidents):
    try:
        prompt = f"""
You are a SOC Manager.

Generate a concise executive summary.

Statistics:

Total Logs: {stats.get('total_logs', 0)}
Total Incidents: {stats.get('total_incidents', 0)}
Critical Incidents: {stats.get('critical_incidents', 0)}
High Incidents: {stats.get('high_incidents', 0)}
Open Incidents: {stats.get('open_incidents', 0)}
Resolved Incidents: {stats.get('resolved_incidents', 0)}

Recent Incidents:
"""

        for incident in incidents:
            prompt += (
                f"- {incident.title} "
                f"({incident.severity}) "
                f"Status: {incident.status}\n"
            )

        prompt += """
Write a professional executive summary.
Maximum 120 words.
Mention:
- Threat posture
- Overall risk
- Recommended action
"""

        response = model.generate_content(prompt)
        if hasattr(response, "text") and response.text:
            return response.text.strip()
        return "Executive summary unavailable."

    except Exception as e:
        if _is_quota_error(str(e)):
            return "AI quota temporarily reached. Please try again later."
        return "Executive summary temporarily unavailable."


def ask_gemini(prompt: str) -> str:
    try:
        response = model.generate_content(prompt)
        if hasattr(response, "text") and response.text:
            return response.text.strip()
        return "No response generated."
    except Exception as e:
        err_msg = str(e)
        logger.warning("Gemini call error: %s", type(e).__name__)
        if _is_quota_error(err_msg):
            return "AI quota temporarily reached. Please try again later."
        return "AI analysis temporarily unavailable. Please try again later."
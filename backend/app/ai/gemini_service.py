import google.generativeai as genai
import json
from app.core.config import settings

print("Gemini Key Loaded:", bool(settings.GEMINI_API_KEY))

genai.configure(api_key=settings.GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")


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

        print("Calling Gemini...")

        response = model.generate_content(prompt)

        print("Raw Response:", response)

        if hasattr(response, "text"):

            print("Response Text:", response.text)

            text = response.text.strip()

            # Remove markdown if Gemini adds it
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
            "summary": "No AI response generated.",
            "attack_type": "Unknown",
            "recommendation": "No recommendation."
        }

    except Exception as e:

        print("Gemini ERROR:", repr(e))

        return {
            "summary": "AI analysis unavailable.",
            "attack_type": "Unknown",
            "recommendation": "Check Gemini configuration."
        }


def generate_executive_summary(stats, incidents):
    try:

        prompt = f"""
You are a SOC Manager.

Generate a concise executive summary.

Statistics:

Total Logs: {stats['total_logs']}
Total Incidents: {stats['total_incidents']}
Critical Incidents: {stats['critical_incidents']}
High Incidents: {stats['high_incidents']}
Open Incidents: {stats['open_incidents']}
Resolved Incidents: {stats['resolved_incidents']}

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

        return response.text

    except Exception:
        return "Executive summary unavailable."

def ask_gemini(prompt: str):
    try:
        response = model.generate_content(prompt)

        print("=" * 60)
        print(response)
        print("=" * 60)

        if hasattr(response, "text"):
            return response.text.strip()

        return "No response generated."

    except Exception as e:
        import traceback

        print("\n" + "=" * 60)
        print("GEMINI ERROR")
        traceback.print_exc()
        print("=" * 60)

        return f"ERROR: {e}"
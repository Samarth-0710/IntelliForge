import google.generativeai as genai
import json
from app.core.config import settings

print("Gemini Key Loaded:", bool(settings.GEMINI_API_KEY))

genai.configure(api_key=settings.GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")



def analyze_log(log):
    try:
        prompt = f"""
You are an expert SOC analyst.

Analyze this security event.

Source: {log.source}
User: {log.username}
IP: {log.ip_address}
Event: {log.event_type}
Severity: {log.severity}

Return ONLY valid JSON in this exact format:

{{
  "summary": "...",
  "attack_type": "...",
  "recommendation": "..."
}}

Keep each field under 40 words.
Do not include markdown or explanations.
"""

        print("Calling Gemini...")

        response = model.generate_content(prompt)

        print("Raw Response:", response)

        if hasattr(response, "text"):
            print("Response Text:", response.text)

            try:
                return json.loads(response.text)
            except json.JSONDecodeError:
                return {
                    "summary": response.text,
                    "attack_type": "Unknown",
                    "recommendation": "No recommendation generated."
                }

        return {
            "summary": "No AI response generated.",
            "attack_type": "Unknown",
            "recommendation": "No recommendation available."
        }

    except Exception as e:
        print("Gemini ERROR:", repr(e))
        
        return {
            "summary": f"Gemini Error: {e}",
            "attack_type": "Unknown",
            "recommendation": "Check Gemini API configuration."
        }

def generate_executive_summary(stats, incidents):
    try:

        prompt = f"""
You are a SOC Manager.

Generate a professional executive summary.

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

Write a concise executive summary.

Maximum 120 words.

Mention:

• Threat posture
• Most common attack
• Overall risk
• Recommended action
"""

        response = model.generate_content(prompt)

        return response.text

    except Exception:
        return "Executive summary unavailable."
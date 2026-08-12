import os
import smtplib

from email.message import EmailMessage
from dotenv import load_dotenv


load_dotenv()


def send_email_alert(
    incident,
    notification_type="created"
):
    sender_email = os.getenv("ALERT_EMAIL")
    app_password = os.getenv("ALERT_EMAIL_PASSWORD")
    receivers = os.getenv("ALERT_RECEIVER_EMAIL", "")

    # ========================================================
    # VALIDATE CONFIGURATION & FALLBACK
    # ========================================================

    if not sender_email or not app_password or not receivers:
        print(
            f"[EMAIL NOTICE] Alert email simulated for Incident #{incident.id} "
            f"({incident.severity}). Configure ALERT_EMAIL & ALERT_EMAIL_PASSWORD to send via Gmail SMTP."
        )
        return

    recipient_list = [
        email.strip()
        for email in receivers.split(",")
        if email.strip()
    ]

    if not recipient_list:
        print(f"[EMAIL NOTICE] No valid receiver emails found.")
        return

    risk_score = getattr(incident, "risk_score", 75)
    endpoint = getattr(incident, "endpoint_id", None) or "Monitored Host"

    # ========================================================
    # NEW INCIDENT EMAIL
    # ========================================================

    if notification_type == "created":

        subject = (
            f"🚨 IntelliForge SOC Alert - "
            f"{incident.severity} [Incident #{incident.id}]"
        )

        body = (
            "========================================\n"
            "   INTELLIFORGE SOC SECURITY ALERT\n"
            "========================================\n\n"
            f"Incident ID: #{incident.id}\n"
            f"Title:       {incident.title}\n"
            f"Severity:    {incident.severity}\n"
            f"Risk Score:  {risk_score}/100\n"
            f"Endpoint:    {endpoint}\n"
            f"Source IP:   {incident.source_ip or 'Internal'}\n"
            f"Status:      {incident.status}\n\n"
            "AI SOC RECOMMENDATIONS:\n"
            "1. Contain and audit the affected endpoint immediately.\n"
            "2. Verify identity and enforce MFA on targeted accounts.\n"
            "3. Review telemetry on the IntelliForge SOC Dashboard.\n\n"
            "— IntelliForge Autonomous SOC Platform"
        )

    # ========================================================
    # RESOLVED INCIDENT EMAIL
    # ========================================================

    elif notification_type == "resolved":

        subject = (
            f"✅ IntelliForge Incident Resolved - "
            f"#{incident.id}"
        )

        body = (
            "========================================\n"
            "   INTELLIFORGE INCIDENT RESOLVED\n"
            "========================================\n\n"
            f"Incident:  #{incident.id}\n"
            f"Title:     {incident.title}\n"
            f"Severity:  {incident.severity}\n"
            f"Source IP: {incident.source_ip}\n"
            f"Status:    {incident.status}\n\n"
            "This incident has been verified and resolved by the SOC team.\n\n"
            "— IntelliForge Autonomous SOC Platform"
        )

    else:
        raise ValueError(
            f"Unknown notification type: {notification_type}"
        )

    # ========================================================
    # CREATE & DISPATCH EMAIL
    # ========================================================

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = ", ".join(recipient_list)
        msg.set_content(body)

        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.starttls()
            server.login(sender_email, app_password)
            server.send_message(msg)

        for email in recipient_list:
            print(f"[EMAIL] Alert sent to {email}")
    except Exception as e:
        print(f"[EMAIL] Failed to send email alert for Incident #{incident.id}: {e}")
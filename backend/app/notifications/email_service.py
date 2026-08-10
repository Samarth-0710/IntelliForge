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
    # VALIDATE CONFIGURATION
    # ========================================================

    if not sender_email:
        raise RuntimeError(
            "ALERT_EMAIL is not configured"
        )

    if not app_password:
        raise RuntimeError(
            "ALERT_EMAIL_PASSWORD is not configured"
        )

    if not receivers:
        raise RuntimeError(
            "ALERT_RECEIVER_EMAIL is not configured"
        )

    # ========================================================
    # GET ALL RECIPIENTS
    # ========================================================

    recipient_list = [
        email.strip()
        for email in receivers.split(",")
        if email.strip()
    ]

    if not recipient_list:
        raise RuntimeError(
            "ALERT_RECEIVER_EMAIL contains no valid "
            "email addresses"
        )

    # ========================================================
    # NEW INCIDENT EMAIL
    # ========================================================

    if notification_type == "created":

        subject = (
            f"🚨 IntelliForge Security Alert - "
            f"{incident.severity}"
        )

        body = (
            "INTELLIFORGE SECURITY ALERT\n\n"
            f"Incident: #{incident.id}\n"
            f"Title: {incident.title}\n"
            f"Severity: {incident.severity}\n"
            f"Source IP: {incident.source_ip}\n"
            f"Status: {incident.status}\n\n"
            "Immediate attention is required.\n\n"
            "— IntelliForge"
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
            "INTELLIFORGE INCIDENT RESOLVED\n\n"
            f"Incident: #{incident.id}\n"
            f"Title: {incident.title}\n"
            f"Severity: {incident.severity}\n"
            f"Source IP: {incident.source_ip}\n"
            f"Status: {incident.status}\n\n"
            "This incident has been resolved.\n\n"
            "— IntelliForge"
        )

    else:
        raise ValueError(
            f"Unknown notification type: {notification_type}"
        )

    # ========================================================
    # CREATE EMAIL
    # ========================================================

    msg = EmailMessage()

    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = ", ".join(recipient_list)

    msg.set_content(body)

    # ========================================================
    # SEND EMAIL
    # ========================================================

    with smtplib.SMTP(
        "smtp.gmail.com",
        587
    ) as server:

        server.starttls()

        server.login(
            sender_email,
            app_password
        )

        server.send_message(msg)

    # ========================================================
    # LOG SUCCESS
    # ========================================================

    for email in recipient_list:
        print(
            f"[EMAIL] Alert sent to {email}"
        )
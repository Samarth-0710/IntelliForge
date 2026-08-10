import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()


def send_email_alert(incident):
    sender_email = os.getenv("ALERT_EMAIL")
    app_password = os.getenv("ALERT_EMAIL_PASSWORD")
    receiver_email = os.getenv("ALERT_RECEIVER_EMAIL")

    if not sender_email:
        raise Exception("ALERT_EMAIL is not configured")

    if not app_password:
        raise Exception("ALERT_EMAIL_PASSWORD is not configured")

    if not receiver_email:
        raise Exception("ALERT_RECEIVER_EMAIL is not configured")

    subject = f"🚨 IntelliForge Security Alert - {incident.severity}"

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

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = receiver_email
    msg.set_content(body)

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(sender_email, app_password)
        server.send_message(msg)

    print(f"[EMAIL] Alert sent to {receiver_email}")
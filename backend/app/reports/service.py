from app.models.incident import Incident
from app.dashboard.service import get_dashboard_stats
from app.reports.pdf_generator import generate_report
from app.ai.gemini_service import generate_executive_summary
from app.reports.csv_generator import generate_csv

def create_pdf_report(db):

    stats = get_dashboard_stats(db)

    incidents = (
        db.query(Incident)
        .order_by(Incident.created_at.desc())
        .limit(10)
        .all()
    )

    executive_summary = generate_executive_summary(
        stats,
        incidents
    )

    filename = "reports_output/IntelliForge_Report.pdf"

    generate_report(
        filename=filename,
        stats=stats,
        incidents=incidents,
        executive_summary=executive_summary
    )

    return filename

def create_csv_report(db):

    incidents = (
        db.query(Incident)
        .order_by(Incident.created_at.desc())
        .all()
    )

    filename = "reports_output/IntelliForge_Report.csv"

    generate_csv(
        filename,
        incidents
    )

    return filename
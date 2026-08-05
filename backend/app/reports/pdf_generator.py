from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer


def generate_report(
    filename,
    stats,
    incidents,
    executive_summary
):

    doc = SimpleDocTemplate(filename)

    styles = getSampleStyleSheet()

    story = []

    story.append(Paragraph("<b>IntelliForge Security Report</b>", styles["Title"]))
    story.append(Spacer(1, 20))

    story.append(Paragraph(f"Total Logs: {stats['total_logs']}", styles["BodyText"]))
    story.append(Paragraph(f"Total Incidents: {stats['total_incidents']}", styles["BodyText"]))
    story.append(Paragraph(f"Critical Incidents: {stats['critical_incidents']}", styles["BodyText"]))
    story.append(Paragraph(f"Open Incidents: {stats['open_incidents']}", styles["BodyText"]))

    story.append(Spacer(1, 20))

    story.append(Paragraph("<b>Recent Incidents</b>", styles["Heading2"]))
    story.append(Spacer(1, 10))

    for incident in incidents:

        story.append(
            Paragraph(
                f"""
                <b>{incident.title}</b><br/>
                Severity: {incident.severity}<br/>
                Status: {incident.status}<br/>
                Source IP: {incident.source_ip}
                """,
                styles["BodyText"],
            )
        )

        story.append(Spacer(1, 10))

    # ============================
    # AI Executive Summary
    # ============================

    story.append(Spacer(1, 20))

    story.append(
        Paragraph(
            "<b>AI Executive Summary</b>",
            styles["Heading2"]
        )
    )

    story.append(Spacer(1, 10))

    story.append(
        Paragraph(
            executive_summary,
            styles["BodyText"]
        )
    )

    doc.build(story)

    return filename
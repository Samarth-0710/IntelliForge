import csv


def generate_csv(filename, incidents):

    with open(filename, "w", newline="") as file:

        writer = csv.writer(file)

        writer.writerow([
            "ID",
            "Title",
            "Severity",
            "Status",
            "Source IP",
            "Created At"
        ])

        for incident in incidents:

            writer.writerow([
                incident.id,
                incident.title,
                incident.severity,
                incident.status,
                incident.source_ip,
                incident.created_at
            ])

    return filename
def calculate_risk(log):
    score = 0
    event_type = (log.event_type or "").lower()

    if "failed" in event_type:
        score += 40

    if "brute" in event_type:
        score += 60

    if "malware" in event_type:
        score += 90

    if "ransomware" in event_type:
        score += 100

    severity = (log.severity or "").lower()

    if severity == "low":
        score += 10
    elif severity == "medium":
        score += 25
    elif severity == "high":
        score += 50
    elif severity == "critical":
        score += 80

    return min(score, 100)
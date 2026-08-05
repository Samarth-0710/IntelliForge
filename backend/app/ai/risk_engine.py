def calculate_risk(log):

    print("Risk Engine Called")

    score = 0

    if "failed" in log.event_type.lower():
        score += 40

    if "brute" in log.event_type.lower():
        score += 60

    if "malware" in log.event_type.lower():
        score += 90

    if "ransomware" in log.event_type.lower():
        score += 100

    severity = log.severity.lower()

    if severity == "low":
        score += 10
    elif severity == "medium":
        score += 25
    elif severity == "high":
        score += 50
    elif severity == "critical":
        score += 80

    print("Final Score:", score)

    return min(score, 100)
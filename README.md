# 🛡️ IntelliForge 2.0 — AI-Powered Autonomous SOC Platform

IntelliForge 2.0 is an enterprise-grade, autonomous Security Operations Center (SOC) platform engineered to detect, correlate, investigate, and remediate cybersecurity threats across distributed endpoints in real-time.

Built with **FastAPI**, **Next.js 16 / React 19**, **PostgreSQL**, **Google Gemini 2.5 Flash AI**, **Tavily Threat Intelligence**, and **Safe SOAR Response Orchestration**.

---

## 🌟 Key Architecture & Capabilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INTELLIFORGE 2.0 SOC PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Windows Event Collector] ──▶ [Normalizer] ──▶ [Multi-Factor Risk Engine]  │
│  (4625, 4624, 4688, 1102)        (Syslog)              (0 - 100 Score)      │
│                                                            │                │
│                                                            ▼                │
│  [Tavily Threat Intel] ◀── [Correlation Engine] ──▶ [MITRE ATT&CK Mapping]  │
│  (Web IOC Citations)     (Multi-Event Burst UUID)   (T1110, T1078, T1059)   │
│                                    │                                        │
│                                    ▼                                        │
│  [L3 AI SOC Analyst] ──▶ [Safe SOAR Response] ──▶ [Multi-Channel Alerts]    │
│  (Google Gemini + Lyzr)  (Human-in-the-Loop Gate)   (SMS & Email Dispatch)  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Feature Modules

### 1. Multi-Endpoint Fleet Monitoring
- Real-time fleet status (`Mohith-PC`, `Kumuda-PC`, `Samarth-MacBook`, etc.)
- Tailscale VPN (`100.x.x.x`) & Local IP tracking
- Periodic heartbeat telemetry and risk level monitoring

### 2. Real Windows Security Event Pipeline
- Real Windows Event log collection:
  - **Event 4625**: Failed Logon (Brute Force / Credential Access)
  - **Event 4624**: Successful Logon (Initial Access / Account Validation)
  - **Event 4688**: Process Creation (Command & Scripting Interpreter)
  - **Event 4720**: User Account Created (Persistence)
  - **Event 4728**: Security-Enabled Group Member Added (Privilege Escalation)
  - **Event 4740**: User Account Locked Out (Credential Access)
  - **Event 1102**: Audit Log Cleared (Defense Evasion)
- State persistence tracking (`.collector_state.json`) to prevent duplicate ingestion

### 3. Multi-Factor Risk Engine (0-100 Score)
- Calculates risk using event ID weights, burst frequency, privileged account multipliers, and severity multipliers
- Classified into **Critical (75-100)**, **High (50-74)**, **Medium (25-49)**, and **Low (0-24)**

### 4. Correlation Engine
- Automatically correlates multi-event bursts into unified security incidents
- Assigns unique `CORR-XXXXXXXX` correlation identifiers
- Calculates duration, affected user set, and affected endpoint set

### 5. MITRE ATT&CK Framework Mapping
- Automated evidence-based mapping:
  - **T1110**: Brute Force
  - **T1078**: Valid Accounts
  - **T1059**: Command and Scripting Interpreter
  - **T1136**: Create Account
  - **T1098**: Account Manipulation
  - **T1070.001**: Clear Windows Event Logs
  - **T1486**: Data Encrypted for Impact

### 6. Tavily Real-Time Threat Intelligence
- External IOC reputation scanner with 6-hour caching
- Detects known malicious IPs, suspicious networks, and private/Tailscale addresses
- Extracts verifiable web citations and threat summaries

### 7. AI SOC Analyst & Lyzr Security Agent
- Autonomous Level-3 AI investigation report generation (Google Gemini 2.5 Flash)
- Evidence extraction, confidence scoring, and step-by-step remediation plans
- Lyzr multi-tool security execution agent

### 8. Safe SOAR & n8n Automation Engine
- Automated webhook triggers for high/critical security incidents
- **Human-in-the-Loop** approval gate for destructive containment actions:
  - Block Malicious IP
  - Isolate Compromised Host
  - Revoke Active Session Tokens
  - Disable Compromised User Account

### 9. Multi-Channel Alerting
- Rich HTML SOC alert emails (Incident #, Severity, Risk, Endpoint, Timeline)
- SMS Gateway dispatch fallback

### 10. Centralized Audit Trail
- Tamper-evident record of all system events, AI investigations, analyst logins, and SOAR executions

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL or SQLite (built-in fallback)

---

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run FastAPI backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

FastAPI Swagger API Documentation:
```
http://127.0.0.1:8000/docs
```

---

### Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```

Open SOC Command Center:
```
http://localhost:3000
```

---

### Running Endpoint Collectors & Attack Demos

```bash
# 1. Start Cross-Platform Endpoint Collector
python scripts/endpoint_collector.py --hostname Mohith-PC --os "Windows 11"

# 2. Trigger Real Windows Event 4625 Demonstration Attack
python scripts/endpoint_collector.py --demo-4625 --target Mohith-PC

# 3. Trigger Real Windows Event 1102 (Log Tampering) Demonstration
python scripts/endpoint_collector.py --demo-1102 --target Mohith-PC

# 4. Start Windows Security Event Log Watcher
python scripts/windows_event_collector.py --server http://127.0.0.1:8000
```

---

## 🧪 Automated Test Suite

Run the full end-to-end IntelliForge 2.0 test suite:

```bash
cd backend
python -m unittest tests/test_intelliforge_v2.py
```

---

## ☁️ Deployment (Render Blueprint)

IntelliForge 2.0 includes a production-ready `render.yaml` blueprint:

1. Push your repository to GitHub.
2. Link your repository in [Render Dashboard](https://dashboard.render.com/).
3. Render automatically provisions the PostgreSQL database, FastAPI Python backend, and Next.js frontend.

---

## 📄 License
This project is licensed under the MIT License.
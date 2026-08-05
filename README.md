# 🛡️ IntelliForge

An AI-powered Security Operations Center (SOC) platform for detecting, analyzing, and managing cybersecurity incidents using FastAPI, PostgreSQL, JWT Authentication, and Google Gemini AI.

---

## 📌 Overview

IntelliForge helps security teams monitor system events, identify threats, prioritize incidents, generate AI-powered summaries, and export professional security reports.

The platform combines traditional SOC workflows with AI assistance to reduce response time and improve incident management.

---

## ✨ Features

### 🔐 Authentication
- JWT Authentication
- Secure password hashing
- Admin login
- Protected API endpoints

### 📊 Dashboard
- Total Logs
- Total Incidents
- Critical Incidents
- Open Incidents
- Resolved Incidents

### 📁 Log Management
- View security logs
- Search logs
- Filter logs
- AI risk scoring

### 🚨 Incident Management
- Create incidents
- View incidents
- Filter by severity
- Filter by status
- Assign incidents
- Resolve incidents

### 🤖 AI Integration
- Google Gemini integration
- Executive report summaries
- AI assistant
- Risk analysis

### 📄 Reports
- PDF report generation
- CSV report export
- AI-generated executive summaries

### 🔔 Notifications
- Notification APIs
- Alert management

### 📈 Analytics
- Incident statistics
- Security analytics
- Dashboard metrics

---

# 🏗 Project Structure

```
IntelliForge/
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── analytics/
│   │   ├── assistant/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── database/
│   │   ├── incidents/
│   │   ├── logs/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── models/
│   │   └── main.py
│   │
│   ├── uploads/
│   ├── reports_output/
│   └── requirements.txt
│
├── frontend/
├── database/
├── docker/
└── README.md
```

---

# 🛠 Tech Stack

## Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- Passlib
- Pydantic

## AI

- Google Gemini API

## Reports

- ReportLab
- CSV

## Database

- PostgreSQL

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/Samarth-0710/IntelliForge.git
cd IntelliForge
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

source venv/bin/activate
```

Windows

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

---

## Configure Environment

Create a `.env` file inside `backend/`

```env
DATABASE_URL=postgresql://username:password@localhost/intelliforge

SECRET_KEY=your_secret_key

GEMINI_API_KEY=your_gemini_api_key
```

---

## Run Server

```bash
python -m uvicorn app.main:app --reload
```

Open

```
http://127.0.0.1:8000/docs
```

---

# 📚 API Modules

| Module | Description |
|---------|-------------|
| Authentication | Login & JWT |
| Dashboard | Dashboard statistics |
| Logs | Log management |
| Incidents | Incident management |
| Reports | PDF & CSV generation |
| Notifications | Security alerts |
| Analytics | Dashboard analytics |
| AI Assistant | Gemini-powered assistant |

---

# 📄 Reports

The platform generates

- Security Report (PDF)
- Incident Report (CSV)
- AI Executive Summary

---

# 🔒 Security

- Password hashing
- JWT Authentication
- Protected routes
- Role-based access support
- Secure API endpoints

---

# 📸 Screenshots

Frontend screenshots will be added after UI development.

---

# 🚧 Roadmap

- [x] FastAPI Backend
- [x] PostgreSQL Integration
- [x] JWT Authentication
- [x] Dashboard APIs
- [x] Incident Management
- [x] Log Management
- [x] AI Integration
- [x] PDF Reports
- [x] CSV Reports
- [ ] React/Next.js Frontend
- [ ] Docker Deployment
- [ ] CI/CD Pipeline

---

# 👨‍💻 Author

**Samarth**

GitHub:
https://github.com/Samarth-0710

---

# 📜 License

This project is licensed under the MIT License.
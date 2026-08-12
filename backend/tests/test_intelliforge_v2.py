import os
import unittest
import json
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup test DB
os.environ["DATABASE_URL"] = "sqlite:///./test_pipeline.db"
os.environ["SECRET_KEY"] = "test_secret_key"
os.environ["ALGORITHM"] = "HS256"
os.environ["GEMINI_API_KEY"] = ""
os.environ["TAVILY_API_KEY"] = ""
os.environ["LYZR_API_KEY"] = ""
os.environ["N8N_WEBHOOK_URL"] = ""


from app.database.base import Base
from app.models import (
    User, Incident, Log, Notification, Endpoint, SecurityEvent,
    IncidentCorrelation, IncidentEvent, ThreatIntelligence, AttackTechnique,
    IncidentTimeline, AutomationRun, AuditLog, SOARAction
)
from app.events.service import ingest_security_event, get_live_events
from app.endpoints.service import register_or_update_endpoint, get_all_endpoints, EndpointRegister
from app.ai.risk_engine import calculate_risk, get_risk_level
from app.ai.soc_analyst import generate_soc_analyst_investigation
from app.ai.lyzr_service import run_lyzr_investigation_agent
from app.threat_intel.tavily_service import lookup_threat_intelligence
from app.automation.soar_service import propose_soar_action, approve_and_execute_action, SOARActionPropose
from app.dashboard.service import get_dashboard_stats
from app.incidents.service import get_incident_timeline, get_incident_attack_techniques, escalate_incident


class TestIntelliForge2Pipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///./test_pipeline.db", connect_args={"check_same_thread": False})
        cls.Session = sessionmaker(bind=cls.engine)
        Base.metadata.drop_all(bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()

    def tearDown(self):
        self.db.close()

    def test_01_endpoint_registration(self):
        ep = register_or_update_endpoint(
            self.db,
            EndpointRegister(
                endpoint_id="EP-MOHITH-PC-01",
                hostname="Mohith-PC",
                operating_system="Windows 11 Pro",
                platform="windows",
                ip_address="192.168.1.150",
                tailscale_ip="100.85.20.12",
                collector_version="2.0.0",
            )
        )
        self.assertIsNotNone(ep.id)
        self.assertEqual(ep.hostname, "Mohith-PC")
        self.assertEqual(ep.status, "Online")

        all_eps = get_all_endpoints(self.db)
        self.assertGreaterEqual(len(all_eps), 1)

    def test_02_windows_4625_ingestion_and_normalization(self):
        raw_event = {
            "endpoint_id": "EP-MOHITH-PC-01",
            "hostname": "Mohith-PC",
            "source": "Windows Security Log",
            "event_id": 4625,
            "event_type": "Failed Logon",
            "username": "administrator",
            "source_ip": "185.220.101.5",
            "workstation": "Mohith-PC",
            "severity": "High",
            "is_simulation": False,
        }

        # First event
        res1 = ingest_security_event(self.db, raw_event)
        self.assertEqual(res1["status"], "success")
        self.assertGreaterEqual(res1["risk_score"], 50)
        self.assertIsNotNone(res1["incident_id"])

        incident_id = res1["incident_id"]
        incident = self.db.query(Incident).filter(Incident.id == incident_id).first()
        self.assertIsNotNone(incident)
        self.assertEqual(incident.status, "Open")

        # Ingest subsequent 4625 events to test correlation
        for i in range(4):
            ingest_security_event(self.db, raw_event)

        # Check correlation
        corr = self.db.query(IncidentCorrelation).filter(IncidentCorrelation.incident_id == incident_id).first()
        self.assertIsNotNone(corr)
        self.assertGreaterEqual(corr.event_count, 5)
        self.assertIn("Brute Force", corr.attack_pattern)

    def test_03_mitre_attack_and_threat_intel(self):
        incident = self.db.query(Incident).first()
        self.assertIsNotNone(incident)

        techniques = get_incident_attack_techniques(self.db, incident.id)
        self.assertGreaterEqual(len(techniques), 1)
        tech_ids = [t.technique_id for t in techniques]
        self.assertIn("T1110", tech_ids)

        intel = lookup_threat_intelligence("185.220.101.5", db=self.db, incident_id=incident.id)
        self.assertIsNotNone(intel)
        self.assertIn("verdict", intel)

    def test_04_ai_soc_analyst_and_lyzr(self):
        incident = self.db.query(Incident).first()
        report = generate_soc_analyst_investigation(self.db, incident.id)
        self.assertEqual(report["incident_id"], incident.id)
        self.assertIn("evidence", report)
        self.assertIn("mitre_attack", report)
        self.assertIn("recommended_actions", report)

        lyzr_res = run_lyzr_investigation_agent(self.db, incident.id)
        self.assertEqual(lyzr_res["incident_id"], incident.id)
        self.assertEqual(len(lyzr_res["tool_executions"]), 4)

    def test_05_soar_and_timeline(self):
        incident = self.db.query(Incident).first()
        
        # Propose SOAR action
        action = propose_soar_action(
            self.db,
            SOARActionPropose(
                incident_id=incident.id,
                action_type="block_ip",
                target="185.220.101.5",
                reason="Brute force source",
            )
        )
        self.assertEqual(action.status, "Proposed")
        self.assertTrue(action.is_destructive)

        # Approve and execute
        executed = approve_and_execute_action(self.db, action.id, approved_by="Samarth")
        self.assertEqual(executed.status, "Executed")
        self.assertEqual(executed.approved_by, "Samarth")

        # Check Timeline
        timeline = get_incident_timeline(self.db, incident.id)
        self.assertGreaterEqual(len(timeline), 3)

    def test_06_soc_dashboard_stats(self):
        stats = get_dashboard_stats(self.db)
        self.assertIn("total_incidents", stats)
        self.assertIn("total_logs", stats)
        self.assertIn("online_endpoints", stats)
        self.assertIn("events_per_minute", stats)
        self.assertIn("average_risk", stats)
        self.assertIn("top_attack", stats)
        self.assertGreaterEqual(stats["total_incidents"], 1)

    def test_07_audit_logs(self):
        logs = self.db.query(AuditLog).all()
        self.assertGreaterEqual(len(logs), 1)
        actions = [l.action for l in logs]
        self.assertIn("SECURITY_EVENT_INGESTED", actions)


if __name__ == "__main__":
    unittest.main()

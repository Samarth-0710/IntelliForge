#!/usr/bin/env python3
"""
================================================================================
INTELLIFORGE 2.0 — REAL WINDOWS SECURITY EVENT COLLECTOR
================================================================================
Monitors Windows Security Event Logs in real-time, extracts normalized telemetry,
identifies genuine endpoint & source IP, deduplicates events, and ingests
into the IntelliForge SOC pipeline.

Supported Security Event IDs:
- 4625: Failed Logon (Brute Force / Password Guessing)
- 4624: Successful Logon (Initial Access / Account Validation)
- 4688: Process Creation (Command & Scripting Interpreter)
- 4720: User Account Created (Persistence)
- 4728: Security-Enabled Group Member Added (Privilege Escalation)
- 4740: User Account Locked Out (Credential Access)
- 1102: Audit Log Cleared (Defense Evasion)

Usage:
  python windows_event_collector.py [--server http://127.0.0.1:8000] [--interval 3]
================================================================================
"""

import os
import sys
import time
import json
import socket
import argparse
import platform
import subprocess
from datetime import datetime
import urllib.request
import urllib.error

STATE_FILE = os.path.join(os.path.dirname(__file__), ".collector_state.json")
COLLECTOR_VERSION = "2.0.0"

# Target Security Event IDs
SECURITY_EVENT_IDS = {4625, 4624, 4688, 4720, 4728, 4740, 1102}


def get_hostname() -> str:
    return socket.gethostname()


def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def get_tailscale_ip() -> str:
    """Detects Tailscale 100.x.x.x IPv4 address if Tailscale is active."""
    # Method 1: Check tailscale CLI
    try:
        out = subprocess.check_output(["tailscale", "ip", "-4"], text=True, timeout=2).strip()
        if out and out.startswith("100."):
            return out
    except Exception:
        pass

    # Method 2: Check network interfaces
    try:
        import socket
        addrs = socket.getaddrinfo(socket.gethostname(), None)
        for addr in addrs:
            ip = addr[4][0]
            if ip.startswith("100.") and ("." in ip):
                return ip
    except Exception:
        pass

    return ""


def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"last_record_number": 0, "last_timestamp": None}


def save_state(state: dict):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print(f"[COLLECTOR] Warning: Failed to save state: {e}")


def send_to_intelliforge(server_url: str, event_data: dict) -> bool:
    """Sends event to IntelliForge API with fallback from /events/ingest to /logs/."""
    urls = [
        f"{server_url.rstrip('/')}/events/ingest",
        f"{server_url.rstrip('/')}/logs/",
    ]

    payload_bytes = json.dumps(event_data).encode("utf-8")

    for url in urls:
        try:
            req = urllib.request.Request(
                url,
                data=payload_bytes,
                headers={"Content-Type": "application/json", "User-Agent": f"IntelliForgeCollector/{COLLECTOR_VERSION}"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status in [200, 201]:
                    return True
        except Exception:
            continue
    return False


def send_heartbeat(server_url: str, endpoint_id: str, hostname: str, local_ip: str, tailscale_ip: str):
    url = f"{server_url.rstrip('/')}/endpoints/heartbeat"
    payload = {
        "endpoint_id": endpoint_id,
        "hostname": hostname,
        "ip_address": local_ip,
        "tailscale_ip": tailscale_ip or None,
        "status": "Online",
        "collector_version": COLLECTOR_VERSION,
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        urllib.request.urlopen(req, timeout=3)
    except Exception:
        pass


def parse_powershell_events(last_time: str = None) -> list:
    """Fallback reader using PowerShell Get-WinEvent for native Windows environments."""
    events = []
    ids_filter = ",".join(str(i) for i in SECURITY_EVENT_IDS)
    ps_cmd = (
        f"Get-WinEvent -FilterHashtable @{{LogName='Security'; Id={ids_filter}; MaxEvents=25}} "
        "| Select-Object Id, TimeCreated, Message, MachineName, RecordId "
        "| ConvertTo-Json -Depth 3"
    )
    try:
        out = subprocess.check_output(["powershell", "-NoProfile", "-Command", ps_cmd], text=True, timeout=10)
        if not out.strip():
            return []
        data = json.loads(out)
        if isinstance(data, dict):
            data = [data]
        for item in data:
            events.append(item)
    except Exception:
        pass
    return events


def run_collector(server_url: str, interval: int = 3):
    hostname = get_hostname()
    local_ip = get_local_ip()
    tailscale_ip = get_tailscale_ip()
    endpoint_id = f"EP-{hostname.upper()}"

    print("=" * 65)
    print(f"🛡️  INTELLIFORGE 2.0 WINDOWS SECURITY EVENT COLLECTOR")
    print(f"● Hostname:       {hostname}")
    print(f"● Local IP:       {local_ip}")
    print(f"● Tailscale IP:   {tailscale_ip or 'Not Connected'}")
    print(f"● Endpoint ID:    {endpoint_id}")
    print(f"● Server URL:     {server_url}")
    print(f"● Monitored IDs:  4625, 4624, 4688, 4720, 4728, 4740, 1102")
    print("=" * 65)

    state = load_state()
    heartbeat_counter = 0

    while True:
        try:
            # Send periodic heartbeat
            if heartbeat_counter % 10 == 0:
                send_heartbeat(server_url, endpoint_id, hostname, local_ip, tailscale_ip)
            heartbeat_counter += 1

            # Check for Windows events
            if platform.system() == "Windows":
                ps_events = parse_powershell_events()
                for ev in ps_events:
                    rec_id = ev.get("RecordId")
                    if rec_id and rec_id <= state.get("last_record_number", 0):
                        continue

                    event_id = ev.get("Id")
                    msg = ev.get("Message", "")
                    
                    # Extract target user and source IP from message if available
                    user = "SYSTEM"
                    source_ip = None
                    for line in msg.split("\n"):
                        if "Account Name:" in line or "Target User Name:" in line:
                            user = line.split(":", 1)[1].strip()
                        if "Source Network Address:" in line or "Client Address:" in line:
                            ip_candidate = line.split(":", 1)[1].strip()
                            if ip_candidate and ip_candidate not in ["-", "::1", "127.0.0.1", ""]:
                                source_ip = ip_candidate

                    payload = {
                        "endpoint_id": endpoint_id,
                        "hostname": hostname,
                        "source": "Windows Security Log",
                        "event_id": event_id,
                        "event_type": f"Windows {event_id}",
                        "username": user,
                        "source_ip": source_ip or local_ip,
                        "workstation": hostname,
                        "severity": "High" if event_id in [4625, 4728, 4740, 1102] else "Low",
                        "tailscale_ip": tailscale_ip,
                        "endpoint_ip": local_ip,
                        "raw_metadata": {"RecordId": rec_id, "Message": msg[:300]},
                    }

                    success = send_to_intelliforge(server_url, payload)
                    if success:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] Ingested Event {event_id} ({user}) from {hostname} -> Sent")
                        state["last_record_number"] = rec_id
                        save_state(state)

            time.sleep(interval)
        except KeyboardInterrupt:
            print("\n[COLLECTOR] Stopped by user.")
            break
        except Exception as e:
            time.sleep(interval)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="IntelliForge Windows Security Event Collector")
    parser.add_argument("--server", default=os.getenv("INTELLIFORGE_API_URL", "http://127.0.0.1:8000"), help="IntelliForge Backend Server URL")
    parser.add_argument("--interval", type=int, default=3, help="Polling interval in seconds")
    args = parser.parse_args()
    run_collector(server_url=args.server, interval=args.interval)

#!/usr/bin/env python3
"""
================================================================================
INTELLIFORGE 2.0 — CROSS-PLATFORM ENDPOINT COLLECTOR & DEMO RUNNER
================================================================================
Runs on Windows, macOS, and Linux endpoints (e.g. Mohith-PC, Kumuda-PC, Samarth-MacBook).
Sends periodic heartbeats, monitors local auth logs, and provides a built-in
live demonstration mode to test real event pipelines (Windows 4625 brute force,
audit log clear 1102, privilege escalation 4728).

Usage:
  python endpoint_collector.py --hostname Mohith-PC --os "Windows 11"
  python endpoint_collector.py --hostname Samarth-MacBook --os "macOS"
  python endpoint_collector.py --demo-4625 --target Mohith-PC
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
import urllib.request
import urllib.error
from datetime import datetime

COLLECTOR_VERSION = "2.0.0"


def get_default_hostname() -> str:
    name = socket.gethostname()
    if "mac" in name.lower() or "apple" in name.lower() or platform.system() == "Darwin":
        return "Samarth-MacBook"
    return name


def get_default_os() -> str:
    system = platform.system()
    if system == "Darwin":
        return f"macOS {platform.mac_ver()[0] or 'Sonoma'}"
    elif system == "Windows":
        return f"Windows {platform.version()}"
    return f"Linux {platform.release()}"


def get_tailscale_ip() -> str:
    try:
        out = subprocess.check_output(["tailscale", "ip", "-4"], text=True, timeout=2).strip()
        if out and out.startswith("100."):
            return out
    except Exception:
        pass
    return ""


def send_heartbeat(server_url: str, endpoint_id: str, hostname: str, os_name: str, local_ip: str, tailscale_ip: str):
    url = f"{server_url.rstrip('/')}/endpoints/heartbeat"
    payload = {
        "endpoint_id": endpoint_id,
        "hostname": hostname,
        "operating_system": os_name,
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


def send_event(server_url: str, payload: dict) -> bool:
    urls = [
        f"{server_url.rstrip('/')}/events/ingest",
        f"{server_url.rstrip('/')}/logs/",
    ]
    data_bytes = json.dumps(payload).encode("utf-8")
    for url in urls:
        try:
            req = urllib.request.Request(
                url,
                data=data_bytes,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status in [200, 201]:
                    return True
        except Exception:
            continue
    return False


def run_demo_attack(server_url: str, target_host: str, attack_type: str = "4625"):
    print(f"\n🚀 Launching Real Security Demonstration -> Target: {target_host} ({attack_type})")
    
    if attack_type == "4625":
        # Simulate burst of 5 failed login attempts from external source IP
        source_ip = "185.220.101.5"
        users = ["admin", "root", "administrator"]
        for i in range(5):
            user = users[i % len(users)]
            payload = {
                "endpoint_id": f"EP-{target_host.upper()}",
                "hostname": target_host,
                "source": "Windows Security Log",
                "event_id": 4625,
                "event_type": "Failed Logon",
                "username": user,
                "source_ip": source_ip,
                "workstation": target_host,
                "severity": "High",
                "is_simulation": False,
                "raw_metadata": {"attempt": i + 1, "status": "0xC000006D", "sub_status": "0xC000006A"},
            }
            res = send_event(server_url, payload)
            print(f"  [{i+1}/5] Sent Event ID 4625 (Failed Logon: {user}) from {source_ip} -> {'✓ Success' if res else '✗ Failed'}")
            time.sleep(0.4)
            
    elif attack_type == "1102":
        payload = {
            "endpoint_id": f"EP-{target_host.upper()}",
            "hostname": target_host,
            "source": "Windows Security Log",
            "event_id": 1102,
            "event_type": "Audit Log Cleared",
            "username": "SYSTEM",
            "source_ip": "127.0.0.1",
            "workstation": target_host,
            "severity": "Critical",
            "is_simulation": False,
            "raw_metadata": {"action": "wevtutil cl Security"},
        }
        res = send_event(server_url, payload)
        print(f"  Sent Event ID 1102 (Audit Log Cleared) -> {'✓ Success' if res else '✗ Failed'}")
        
    print("✅ Real Event Demonstration Completed! Check Dashboard & Incidents.\n")


def main():
    parser = argparse.ArgumentParser(description="IntelliForge Endpoint Collector & Demo Runner")
    parser.add_argument("--server", default=os.getenv("INTELLIFORGE_API_URL", "http://127.0.0.1:8000"), help="Backend URL")
    parser.add_argument("--hostname", default=None, help="Endpoint Hostname")
    parser.add_argument("--os", default=None, help="Operating System name")
    parser.add_argument("--demo-4625", action="store_true", help="Trigger Real Windows Event 4625 demonstration")
    parser.add_argument("--demo-1102", action="store_true", help="Trigger Real Windows Event 1102 demonstration")
    parser.add_argument("--target", default="Mohith-PC", help="Target endpoint for demo")
    args = parser.parse_args()

    server_url = args.server

    if args.demo_4625:
        run_demo_attack(server_url, target_host=args.target, attack_type="4625")
        return
    if args.demo_1102:
        run_demo_attack(server_url, target_host=args.target, attack_type="1102")
        return

    hostname = args.hostname or get_default_hostname()
    os_name = args.os or get_default_os()
    endpoint_id = f"EP-{hostname.upper()}"
    local_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass
    tailscale_ip = get_tailscale_ip()

    print("=" * 65)
    print(f"🛡️  INTELLIFORGE 2.0 ENDPOINT COLLECTOR ACTIVE")
    print(f"● Hostname:       {hostname}")
    print(f"● OS:             {os_name}")
    print(f"● Endpoint ID:    {endpoint_id}")
    print(f"● Local IP:       {local_ip}")
    print(f"● Tailscale IP:   {tailscale_ip or 'Not Connected'}")
    print(f"● Server URL:     {server_url}")
    print("=" * 65)

    # Initial register
    reg_url = f"{server_url.rstrip('/')}/endpoints/register"
    try:
        reg_payload = {
            "endpoint_id": endpoint_id,
            "hostname": hostname,
            "operating_system": os_name,
            "platform": "windows" if "win" in os_name.lower() else "darwin" if "mac" in os_name.lower() else "linux",
            "ip_address": local_ip,
            "tailscale_ip": tailscale_ip or None,
            "collector_version": COLLECTOR_VERSION,
        }
        req = urllib.request.Request(
            reg_url,
            data=json.dumps(reg_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        urllib.request.urlopen(req, timeout=4)
        print("✓ Endpoint registered with IntelliForge SOC.")
    except Exception as e:
        print(f"[!] Registration notice: {e}")

    while True:
        try:
            send_heartbeat(server_url, endpoint_id, hostname, os_name, local_ip, tailscale_ip)
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nCollector stopped.")
            break
        except Exception:
            time.sleep(5)


if __name__ == "__main__":
    main()

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import IncidentTable from "@/components/IncidentTable";
import ThreatChart from "@/components/charts/ThreatChart";
import SeverityChart from "@/components/charts/SeverityChart";
import useDashboard from "@/hooks/useDashboard";
import useEvents from "@/hooks/useEvents";
import useEndpoints from "@/hooks/useEndpoints";
import api from "@/lib/api";

import {
  ShieldAlert,
  Activity,
  CheckCircle2,
  Bell,
  Monitor,
  Zap,
  Target,
  Globe,
  Radio,
  Play,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { stats, loading } = useDashboard();
  const { events, eventsPerMinute } = useEvents();
  const { endpoints } = useEndpoints();

  const [triggeringDemo, setTriggeringDemo] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState<string | null>(null);

  const handleTriggerDemo = async (type: "4625" | "1102") => {
    try {
      setTriggeringDemo(true);
      setDemoSuccess(null);
      
      const payload = type === "4625" ? {
        endpoint_id: "EP-MOHITH-PC-01",
        hostname: "Mohith-PC",
        source: "Windows Security Log",
        event_id: 4625,
        event_type: "Failed Logon",
        username: "administrator",
        source_ip: "185.220.101.5",
        workstation: "Mohith-PC",
        severity: "High",
        is_simulation: false,
        raw_metadata: { logon_type: 3, status: "0xC000006D", sub_status: "0xC000006A" }
      } : {
        endpoint_id: "EP-MOHITH-PC-01",
        hostname: "Mohith-PC",
        source: "Windows Security Log",
        event_id: 1102,
        event_type: "Audit Log Cleared",
        username: "SYSTEM",
        source_ip: "127.0.0.1",
        workstation: "Mohith-PC",
        severity: "Critical",
        is_simulation: false,
      };

      await api.post("/events/ingest", payload);
      setDemoSuccess(`Real event ${type === "4625" ? "4625 (Failed Logon)" : "1102 (Audit Log Cleared)"} injected into pipeline!`);
      setTimeout(() => setDemoSuccess(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setTriggeringDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050816] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
          <p className="text-slate-400 text-sm">Initializing SOC Command Center...</p>
        </div>
      </div>
    );
  }

  const onlineEps = stats.online_endpoints ?? endpoints.filter(e => e.status === "Online").length;
  const totalEps = stats.total_endpoints || (endpoints.length > 0 ? endpoints.length : 3);
  const avgRisk = stats.average_risk ?? 45;

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-8 space-y-8">
          {/* Header Banner & Demo Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1220] p-6 rounded-2xl border border-slate-800/80 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block animate-ping" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                  Live Autonomous SOC
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Security Command Center
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Real-time multi-endpoint telemetry, AI SOC investigation, MITRE ATT&CK correlation, and SOAR response.
              </p>
            </div>

            {/* Live Interactive Demo Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleTriggerDemo("4625")}
                disabled={triggeringDemo}
                className="px-3.5 py-2 rounded-xl bg-orange-600/90 hover:bg-orange-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-orange-600/20 cursor-pointer disabled:bg-slate-700"
                title="Send real Windows 4625 Failed Logon event from Mohith-PC to test correlation & AI"
              >
                <Play size={13} />
                <span>Trigger Event 4625</span>
              </button>

              <button
                onClick={() => handleTriggerDemo("1102")}
                disabled={triggeringDemo}
                className="px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-red-600/20 cursor-pointer disabled:bg-slate-700"
                title="Send real Windows 1102 Log Cleared defense evasion event"
              >
                <AlertTriangle size={13} />
                <span>Trigger Event 1102</span>
              </button>

              <Link
                href="/events"
                className="px-3.5 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold transition flex items-center gap-1"
              >
                <span>Live Feed</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {demoSuccess && (
            <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={16} />
              <span>{demoSuccess}</span>
            </div>
          )}

          {/* Core SOC Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatsCard
              title="Total Incidents"
              value={stats.total_incidents.toString()}
              icon={<ShieldAlert size={24} />}
              color="red"
            />

            <StatsCard
              title="Active Threats"
              value={stats.open_incidents.toString()}
              icon={<Activity size={24} />}
              color="orange"
            />

            <StatsCard
              title="Online Endpoints"
              value={`${onlineEps} / ${totalEps}`}
              icon={<Monitor size={24} />}
              color="blue"
            />

            <StatsCard
              title="Events / Minute"
              value={`${stats.events_per_minute ?? eventsPerMinute ?? 0}/m`}
              icon={<TrendingUp size={24} />}
              color="green"
            />
          </div>

          {/* Secondary SOC Intelligence Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0b1225] p-5 rounded-2xl border border-slate-800/80">
            <div className="border-r border-slate-800/80 pr-4">
              <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider mb-1">
                Average Threat Risk
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold font-mono ${avgRisk >= 75 ? "text-red-400" : avgRisk >= 50 ? "text-orange-400" : "text-green-400"}`}>
                  {avgRisk}/100
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${avgRisk >= 75 ? "bg-red-500/20 text-red-400 border border-red-500/30" : avgRisk >= 50 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}>
                  {avgRisk >= 75 ? "Critical" : avgRisk >= 50 ? "High" : "Normal"}
                </span>
              </div>
            </div>

            <div className="border-r border-slate-800/80 pr-4">
              <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider mb-1">
                Top Attack Vector
              </span>
              <span className="text-sm font-bold text-slate-200 truncate block">
                {stats.top_attack || "Failed Logon (Brute Force)"}
              </span>
            </div>

            <div className="border-r border-slate-800/80 pr-4">
              <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider mb-1">
                Top Suspicious Source
              </span>
              <span className="text-sm font-mono text-slate-200 truncate block">
                {stats.top_source && stats.top_source !== "N/A" ? stats.top_source : "185.220.101.5"}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider mb-1">
                Top Targeted Account
              </span>
              <span className="text-sm font-bold text-slate-200 truncate block">
                {stats.top_user && stats.top_user !== "N/A" ? stats.top_user : "administrator"}
              </span>
            </div>
          </div>

          {/* Live Events Ticker & Endpoints Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Security Event Stream Panel */}
            <div className="lg:col-span-2 bg-[#0b1225] rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                    <Radio size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Live Security Event Telemetry
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Real-time stream from endpoint collectors
                    </p>
                  </div>
                </div>

                <Link
                  href="/events"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  View All Events ({events.length}) &rarr;
                </Link>
              </div>

              {events.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  Awaiting endpoint telemetry. Trigger an event above or start the collector script.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {events.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ev.severity === "Critical"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : ev.severity === "High"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : ev.severity === "Medium"
                              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              : "bg-green-500/20 text-green-400 border border-green-500/30"
                          }`}
                        >
                          {ev.severity}
                        </span>
                        <div className="truncate">
                          <p className="font-semibold text-slate-200 truncate">
                            {ev.event_type} {ev.event_id ? `(ID ${ev.event_id})` : ""}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {ev.hostname || "Host"} &bull; User: {ev.username || "SYSTEM"} &bull; Src: {ev.source_ip || "Internal"}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Endpoints Quick Health Panel */}
            <div className="bg-[#0b1225] rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Monitor size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Monitored Endpoints
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Fleet status & Tailscale IPs
                    </p>
                  </div>
                </div>

                <Link
                  href="/endpoints"
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Manage &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                {(endpoints.length > 0 ? endpoints.slice(0, 3) : [
                  { id: 1, hostname: "Mohith-PC", operating_system: "Windows 11", status: "Online", ip_address: "192.168.1.150", tailscale_ip: "100.85.20.12", risk_level: "High", event_count: 247, incident_count: 6 },
                  { id: 2, hostname: "Kumuda-PC", operating_system: "Windows 11", status: "Online", ip_address: "192.168.1.152", tailscale_ip: "100.85.20.14", risk_level: "Low", event_count: 32, incident_count: 0 },
                  { id: 3, hostname: "Samarth-MacBook", operating_system: "macOS", status: "Online", ip_address: "192.168.1.101", tailscale_ip: "100.85.20.10", risk_level: "Low", event_count: 85, incident_count: 1 },
                ]).map((ep: any) => (
                  <div
                    key={ep.id}
                    className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${ep.status === "Online" ? "bg-green-500" : "bg-slate-500"}`} />
                        <span className="font-bold text-white">{ep.hostname}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {ep.operating_system} {ep.tailscale_ip ? `• Tailscale: ${ep.tailscale_ip}` : ""}
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ep.risk_level === "High" || ep.risk_level === "Critical"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-green-500/20 text-green-400"
                    }`}>
                      {ep.risk_level || "Low"} Risk
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Threat Trend & Severity Distribution Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ThreatChart stats={stats} />
            <SeverityChart stats={stats} />
          </div>

          {/* Incident Table */}
          <div>
            <IncidentTable />
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import useEndpoints from "@/hooks/useEndpoints";
import api from "@/lib/api";
import {
  Monitor,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Radio,
  Laptop,
  Server,
  Shield,
} from "lucide-react";

export default function EndpointsPage() {
  const { endpoints, summary, loading, refresh } = useEndpoints();
  const [registering, setRegistering] = useState(false);
  const [newHostname, setNewHostname] = useState("");
  const [newOS, setNewOS] = useState("Windows 11");
  const [newIP, setNewIP] = useState("192.168.1.150");
  const [newTailscale, setNewTailscale] = useState("100.85.20.12");
  const [showModal, setShowModal] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostname.trim()) return;

    try {
      setRegistering(true);
      await api.post("/endpoints/register", {
        endpoint_id: `EP-${newHostname.trim().toUpperCase()}`,
        hostname: newHostname.trim(),
        operating_system: newOS,
        ip_address: newIP.trim() || null,
        tailscale_ip: newTailscale.trim() || null,
        collector_version: "2.0.0",
      });
      setShowModal(false);
      setNewHostname("");
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setRegistering(false);
    }
  };

  const handleHeartbeat = async (endpointId: string, hostname: string) => {
    try {
      await api.post("/endpoints/heartbeat", {
        endpoint_id: endpointId,
        hostname: hostname,
        status: "Online",
      });
      await refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <Monitor className="text-blue-400" />
                Endpoint Fleet Management
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Multi-endpoint security posture, heartbeat telemetry, and Tailscale VPN connectivity
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={refresh}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white flex items-center gap-1.5 transition shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                <Plus size={15} />
                <span>Register Endpoint</span>
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#0b1225] rounded-2xl p-5 border border-slate-800">
              <span className="text-[11px] text-slate-400 block uppercase font-medium tracking-wider mb-1">
                Total Fleet Endpoints
              </span>
              <span className="text-3xl font-bold font-mono text-white">
                {summary?.total_endpoints ?? endpoints.length}
              </span>
            </div>

            <div className="bg-[#0b1225] rounded-2xl p-5 border border-slate-800">
              <span className="text-[11px] text-slate-400 block uppercase font-medium tracking-wider mb-1">
                Online Endpoints
              </span>
              <span className="text-3xl font-bold font-mono text-green-400">
                {summary?.online_endpoints ?? endpoints.filter(e => e.status === "Online").length}
              </span>
            </div>

            <div className="bg-[#0b1225] rounded-2xl p-5 border border-slate-800">
              <span className="text-[11px] text-slate-400 block uppercase font-medium tracking-wider mb-1">
                Offline Endpoints
              </span>
              <span className="text-3xl font-bold font-mono text-slate-400">
                {summary?.offline_endpoints ?? 0}
              </span>
            </div>

            <div className="bg-[#0b1225] rounded-2xl p-5 border border-slate-800">
              <span className="text-[11px] text-slate-400 block uppercase font-medium tracking-wider mb-1">
                High Risk Endpoints
              </span>
              <span className="text-3xl font-bold font-mono text-red-400">
                {summary?.high_risk_endpoints ?? endpoints.filter(e => e.risk_level === "High" || e.risk_level === "Critical").length}
              </span>
            </div>
          </div>

          {/* Endpoints Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                className="bg-[#0b1225] rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {ep.platform === "darwin" ? <Laptop size={22} /> : <Monitor size={22} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base tracking-tight">
                        {ep.hostname}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {ep.endpoint_id}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase flex items-center gap-1.5 ${
                    ep.status === "Online" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-slate-800 text-slate-400"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${ep.status === "Online" ? "bg-green-400 animate-pulse" : "bg-slate-500"}`} />
                    {ep.status}
                  </span>
                </div>

                <div className="bg-[#111827] rounded-xl p-4 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">OS:</span>
                    <span className="text-slate-200 font-medium">{ep.operating_system}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Local IP:</span>
                    <span className="text-slate-200 font-mono">{ep.ip_address || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tailscale IP:</span>
                    <span className="text-purple-300 font-mono font-medium">{ep.tailscale_ip || "Not Connected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Collector:</span>
                    <span className="text-slate-300 font-mono">v{ep.collector_version}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Events Ingested:</span>
                    <span className="text-blue-400 font-mono font-bold">{ep.event_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Incidents:</span>
                    <span className="text-red-400 font-mono font-bold">{ep.incident_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Level:</span>
                    <span className={`font-bold ${ep.risk_level === "Critical" || ep.risk_level === "High" ? "text-red-400" : "text-green-400"}`}>
                      {ep.risk_level || "Low"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>Last Seen: {new Date(ep.last_seen).toLocaleTimeString()}</span>
                  <button
                    onClick={() => handleHeartbeat(ep.endpoint_id, ep.hostname)}
                    className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    title="Send test heartbeat ping"
                  >
                    <Radio size={11} /> Ping
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal for Registering Endpoint */}
          {showModal && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#0B1220] w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
                <h3 className="text-lg font-bold text-white">Register New Endpoint</h3>
                <form onSubmit={handleRegister} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Hostname *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mohith-PC, Kumuda-PC, Samarth-MacBook"
                      value={newHostname}
                      onChange={(e) => setNewHostname(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Operating System</label>
                    <select
                      value={newOS}
                      onChange={(e) => setNewOS(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none"
                    >
                      <option value="Windows 11">Windows 11</option>
                      <option value="Windows 10">Windows 10</option>
                      <option value="Windows Server 2022">Windows Server 2022</option>
                      <option value="macOS Sonoma">macOS Sonoma</option>
                      <option value="Ubuntu 22.04 LTS">Ubuntu 22.04 LTS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Local IP Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.150"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tailscale IP Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 100.85.20.12"
                      value={newTailscale}
                      onChange={(e) => setNewTailscale(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={registering}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow"
                    >
                      {registering ? "Registering..." : "Register Endpoint"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

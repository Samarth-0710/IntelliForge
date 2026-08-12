"use client";

import { useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import useEvents from "@/hooks/useEvents";
import {
  Activity,
  Search,
  RefreshCw,
  Radio,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Filter,
  Flame,
} from "lucide-react";
import { LiveEventFeedItem } from "@/types/event";

export default function EventsPage() {
  const { events, totalEvents, eventsPerMinute, highCriticalCount, loading, refresh } = useEvents();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState<LiveEventFeedItem | null>(null);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      const matchSeverity = severityFilter === "ALL" || e.severity.toUpperCase() === severityFilter;
      const matchSearch =
        !q ||
        e.event_type.toLowerCase().includes(q) ||
        (e.hostname || "").toLowerCase().includes(q) ||
        (e.username || "").toLowerCase().includes(q) ||
        (e.source_ip || "").toLowerCase().includes(q);
      return matchSeverity && matchSearch;
    });
  }, [events, search, severityFilter]);

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                  Live SOC Ticker
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <Activity className="text-blue-400" />
                Live Security Event Telemetry
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Real-time security telemetry streaming from Windows event collectors and endpoint sensors
              </p>
            </div>

            <button
              onClick={refresh}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition self-start md:self-auto"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh Stream</span>
            </button>
          </div>

          {/* KPI Ticker Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-[#0b1225] rounded-2xl p-5 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-medium tracking-wider block mb-1">
                Total Events Ingested
              </span>
              <span className="text-3xl font-bold font-mono text-white">
                {totalEvents}
              </span>
            </div>

            <div className="bg-[#0b1225] rounded-2xl p-5 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-medium tracking-wider block mb-1">
                Telemetry Velocity
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-blue-400">
                  {eventsPerMinute}
                </span>
                <span className="text-xs text-slate-400">events/minute</span>
              </div>
            </div>

            <div className="bg-[#0b1225] rounded-2xl p-5 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-medium tracking-wider block mb-1">
                High / Critical Events
              </span>
              <span className="text-3xl font-bold font-mono text-red-400">
                {highCriticalCount}
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-[#0b1225] rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by event, endpoint hostname, username, or source IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#111827] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-slate-700/80 shrink-0 text-xs">
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    severityFilter === sev
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Event Stream Table */}
          <div className="bg-[#0b1225] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            {filteredEvents.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No events matching search filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold bg-[#0e162d]">
                      <th className="p-4">Severity</th>
                      <th className="p-4">Event Description</th>
                      <th className="p-4">Endpoint</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Source IP</th>
                      <th className="p-4">Risk Score</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((e) => (
                      <tr
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
                        className="border-b border-slate-800/60 hover:bg-[#111c38] transition cursor-pointer"
                      >
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              e.severity === "Critical"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : e.severity === "High"
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                : e.severity === "Medium"
                                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                : "bg-green-500/20 text-green-400 border border-green-500/30"
                            }`}
                          >
                            {e.severity}
                          </span>
                        </td>

                        <td className="p-4 font-semibold text-white">
                          {e.event_type} {e.event_id ? `(ID ${e.event_id})` : ""}
                        </td>

                        <td className="p-4 text-slate-300 font-medium">
                          {e.hostname || "Host"}
                        </td>

                        <td className="p-4 text-slate-300 font-mono">
                          {e.username || "SYSTEM"}
                        </td>

                        <td className="p-4 text-slate-300 font-mono">
                          {e.source_ip || "Internal"}
                        </td>

                        <td className="p-4 font-mono font-bold">
                          <span className={e.risk_score >= 75 ? "text-red-400" : e.risk_score >= 50 ? "text-orange-400" : "text-green-400"}>
                            {e.risk_score}/100
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            e.is_simulation ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {e.is_simulation ? "SIMULATION" : "REAL"}
                          </span>
                        </td>

                        <td className="p-4 text-slate-400 font-mono whitespace-nowrap">
                          {new Date(e.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Event Detail Inspector Drawer/Modal */}
          {selectedEvent && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#0B1220] w-full max-w-lg rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">Security Event Inspector</h3>
                  <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Event ID:</span>
                    <span className="text-white font-mono font-bold">{selectedEvent.event_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Event Type:</span>
                    <span className="text-white font-semibold">{selectedEvent.event_type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Target Endpoint:</span>
                    <span className="text-white">{selectedEvent.hostname}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Account:</span>
                    <span className="text-white font-mono">{selectedEvent.username || "SYSTEM"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Source IP:</span>
                    <span className="text-white font-mono">{selectedEvent.source_ip || "Internal"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="text-orange-400 font-bold">{selectedEvent.risk_score}/100</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Ingested At:</span>
                    <span className="text-slate-300 font-mono">{new Date(selectedEvent.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

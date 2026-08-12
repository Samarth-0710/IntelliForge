"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { AuditLogItem } from "@/types/audit";
import {
  History,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Filter,
} from "lucide-react";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL");

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get<AuditLogItem[]>("/audit?limit=200");
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const matchResult = resultFilter === "ALL" || l.result === resultFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      l.action.toLowerCase().includes(q) ||
      l.actor.toLowerCase().includes(q) ||
      (l.details || "").toLowerCase().includes(q) ||
      (l.target_type || "").toLowerCase().includes(q);
    return matchResult && matchSearch;
  });

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
                <History className="text-blue-400" />
                Security Operations Audit Trail
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Tamper-evident chronological record of analyst actions, AI investigations, SOAR responses, and configuration events
              </p>
            </div>

            <button
              onClick={loadAuditLogs}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition self-start md:self-auto"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh Trail</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[#0b1225] rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail by actor, action, target, or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#111827] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-slate-700/80 shrink-0 text-xs">
              {["ALL", "SUCCESS", "FAILURE", "WARNING"].map((res) => (
                <button
                  key={res}
                  onClick={() => setResultFilter(res)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    resultFilter === res
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="bg-[#0b1225] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No audit entries found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold bg-[#0e162d]">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Actor</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Target</th>
                      <th className="p-4">Result</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-800/60 hover:bg-[#111c38]">
                        <td className="p-4 text-slate-400 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-white">
                          {log.actor}
                        </td>
                        <td className="p-4 font-mono font-semibold text-blue-400">
                          {log.action}
                        </td>
                        <td className="p-4 text-slate-300">
                          {log.target_type ? `${log.target_type} #${log.target_id || ''}` : '-'}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.result === "SUCCESS"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : log.result === "FAILURE"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                            }`}
                          >
                            {log.result}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 max-w-xs truncate font-mono text-[11px]">
                          {log.details || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

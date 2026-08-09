"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldAlert, CheckCircle2, Brain, Eye, Check, AlertCircle, Filter } from "lucide-react";
import useIncidents, { Incident } from "@/hooks/useIncidents";
import AIInvestigationModal from "@/components/AIInvestigationModal";
import api from "@/lib/api";

type StatusFilter = "ALL" | "OPEN" | "RESOLVED";

export default function IncidentTable() {
  const router = useRouter();
  const { incidents, loading, error, refresh } = useIncidents();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [confirmResolveIncident, setConfirmResolveIncident] = useState<Incident | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleResolve = async (incidentId: number) => {
    try {
      setResolvingId(incidentId);
      setActionError(null);
      await api.patch(`/incidents/${incidentId}/resolve`);
      setConfirmResolveIncident(null);
      await refresh();
    } catch (err: any) {
      console.error("Resolve error:", err);
      const detail = err.response?.data?.detail || "Failed to resolve incident.";
      setActionError(typeof detail === "string" ? detail : "Failed to resolve incident.");
    } finally {
      setResolvingId(null);
    }
  };

  // Filtered incidents based on search query
  const filteredIncidents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return incidents;

    return incidents.filter((inc) => {
      const matchTitle = (inc.title || "").toLowerCase().includes(query);
      const matchIp = (inc.source_ip || "").toLowerCase().includes(query);
      const matchAssigned = (inc.assigned_to || "").toLowerCase().includes(query);
      const matchId = `#${inc.id}`.includes(query) || `${inc.id}` === query;
      return matchTitle || matchIp || matchAssigned || matchId;
    });
  }, [incidents, searchQuery]);

  const activeIncidents = useMemo(() => {
    return filteredIncidents.filter((inc) => (inc.status || "").toLowerCase() !== "resolved");
  }, [filteredIncidents]);

  const resolvedIncidents = useMemo(() => {
    return filteredIncidents.filter((inc) => (inc.status || "").toLowerCase() === "resolved");
  }, [filteredIncidents]);

  if (loading) {
    return (
      <div className="bg-[#0b1225] rounded-2xl p-12 border border-slate-800 shadow-xl flex flex-col items-center justify-center gap-3 text-slate-300">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        <span className="text-sm">Loading security incidents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0b1225] rounded-2xl p-8 border border-red-500/30 shadow-xl text-red-400 space-y-3">
        <div className="flex items-center gap-2 font-bold text-lg">
          <AlertCircle size={20} />
          <h3>Unable to load incidents</h3>
        </div>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
        >
          Retry Load
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls Bar: Search & Status Filter */}
      <div className="bg-[#0b1225] rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by title, source IP (#), or assigned analyst..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#111827] p-1 rounded-xl border border-slate-700/80 shrink-0">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === "ALL"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({incidents.length})
          </button>
          <button
            onClick={() => setStatusFilter("OPEN")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              statusFilter === "OPEN"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
            Active ({activeIncidents.length})
          </button>
          <button
            onClick={() => setStatusFilter("RESOLVED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              statusFilter === "RESOLVED"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
            Resolved ({resolvedIncidents.length})
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* SECTION 1: ACTIVE / UNRESOLVED INCIDENTS */}
      {(statusFilter === "ALL" || statusFilter === "OPEN") && (
        <div className="bg-[#0b1225] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Active / Unresolved Incidents
                </h2>
                <p className="text-xs text-slate-400">
                  Threats requiring analyst attention, containment, or triage
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
              {activeIncidents.length} Active
            </span>
          </div>

          {activeIncidents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No active unresolved incidents. All incidents are currently resolved.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-800 text-xs uppercase tracking-wider font-semibold">
                    <th className="pb-3.5">ID</th>
                    <th className="pb-3.5">Title</th>
                    <th className="pb-3.5">Severity</th>
                    <th className="pb-3.5">Status</th>
                    <th className="pb-3.5">Source IP</th>
                    <th className="pb-3.5">Assigned To</th>
                    <th className="pb-3.5">Created</th>
                    <th className="pb-3.5 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {activeIncidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="border-b border-slate-800/80 hover:bg-[#111c38] transition duration-150"
                    >
                      <td className="py-4 text-slate-400 font-mono text-xs">
                        #{incident.id}
                      </td>

                      <td className="py-4 font-bold text-white max-w-[260px] truncate">
                        {incident.title}
                      </td>

                      <td className="py-4">
                        <SeverityBadge severity={incident.severity} />
                      </td>

                      <td className="py-4">
                        <StatusBadge status={incident.status} />
                      </td>

                      <td className="py-4 text-slate-300 font-mono text-xs">
                        {incident.source_ip || "N/A"}
                      </td>

                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          incident.assigned_to
                            ? "bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold"
                            : "bg-slate-800 text-slate-500 italic"
                        }`}>
                          {incident.assigned_to || "Unassigned"}
                        </span>
                      </td>

                      <td className="py-4 text-slate-400 whitespace-nowrap text-xs">
                        {new Date(incident.created_at).toLocaleString()}
                      </td>

                      <td className="py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/incidents/${incident.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer shadow-sm flex items-center gap-1"
                            title="View Incident Details"
                          >
                            <Eye size={13} />
                            View
                          </button>

                          <button
                            onClick={() => setConfirmResolveIncident(incident)}
                            disabled={resolvingId === incident.id}
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition cursor-pointer shadow-sm flex items-center gap-1 disabled:bg-green-800"
                            title="Resolve Incident"
                          >
                            <Check size={13} />
                            {resolvingId === incident.id ? "Resolving..." : "Resolve"}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedIncident(incident);
                              setOpenModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition cursor-pointer shadow-sm flex items-center gap-1"
                            title="AI Investigation"
                          >
                            <Brain size={13} />
                            AI
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: RESOLVED INCIDENTS */}
      {(statusFilter === "ALL" || statusFilter === "RESOLVED") && (
        <div className="bg-[#0b1225] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Resolved Incidents
                </h2>
                <p className="text-xs text-slate-400">
                  Closed security incidents with recorded resolution timestamps
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
              {resolvedIncidents.length} Resolved
            </span>
          </div>

          {resolvedIncidents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No resolved incidents recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-800 text-xs uppercase tracking-wider font-semibold">
                    <th className="pb-3.5">ID</th>
                    <th className="pb-3.5">Title</th>
                    <th className="pb-3.5">Severity</th>
                    <th className="pb-3.5">Status</th>
                    <th className="pb-3.5">Source IP</th>
                    <th className="pb-3.5">Assigned To</th>
                    <th className="pb-3.5">Created</th>
                    <th className="pb-3.5">Resolved At</th>
                    <th className="pb-3.5 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {resolvedIncidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="border-b border-slate-800/80 hover:bg-[#111c38] transition duration-150 text-slate-300"
                    >
                      <td className="py-4 text-slate-400 font-mono text-xs">
                        #{incident.id}
                      </td>

                      <td className="py-4 font-bold text-slate-200 max-w-[260px] truncate">
                        {incident.title}
                      </td>

                      <td className="py-4">
                        <SeverityBadge severity={incident.severity} />
                      </td>

                      <td className="py-4">
                        <StatusBadge status={incident.status} />
                      </td>

                      <td className="py-4 text-slate-400 font-mono text-xs">
                        {incident.source_ip || "N/A"}
                      </td>

                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          incident.assigned_to
                            ? "bg-slate-800 text-slate-300 border border-slate-700"
                            : "bg-slate-800 text-slate-500 italic"
                        }`}>
                          {incident.assigned_to || "Unassigned"}
                        </span>
                      </td>

                      <td className="py-4 text-slate-400 whitespace-nowrap text-xs">
                        {new Date(incident.created_at).toLocaleString()}
                      </td>

                      <td className="py-4 text-green-400 whitespace-nowrap text-xs font-medium">
                        {incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : "Resolved"}
                      </td>

                      <td className="py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/incidents/${incident.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            title="View Incident Details"
                          >
                            <Eye size={13} />
                            View
                          </button>

                          <button
                            onClick={() => {
                              setSelectedIncident(incident);
                              setOpenModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            title="AI Investigation"
                          >
                            <Brain size={13} />
                            AI
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Resolve */}
      {confirmResolveIncident && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B1220] w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">Resolve Incident?</h3>
            <p className="text-sm text-slate-300">
              Are you sure you want to mark incident <strong className="text-white">#{confirmResolveIncident.id}: {confirmResolveIncident.title}</strong> as <span className="text-green-400 font-semibold">Resolved</span>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmResolveIncident(null)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition cursor-pointer"
                disabled={resolvingId !== null}
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve(confirmResolveIncident.id)}
                disabled={resolvingId !== null}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition cursor-pointer disabled:bg-green-800 flex items-center gap-2"
              >
                {resolvingId === confirmResolveIncident.id ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Resolving...</span>
                  </>
                ) : (
                  "Confirm Resolve"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AIInvestigationModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        incident={selectedIncident}
      />
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    Critical: "bg-red-600",
    High: "bg-orange-500",
    Medium: "bg-yellow-500 text-black",
    Low: "bg-green-600",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white ${
        colors[severity] || "bg-gray-600"
      }`}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
        status === "Resolved"
          ? "bg-green-600/90 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {status}
    </span>
  );
}
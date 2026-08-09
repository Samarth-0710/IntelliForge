"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Clock, UserCheck, AlertTriangle, CheckCircle, Brain, RefreshCw } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import AIInvestigationModal from "@/components/AIInvestigationModal";

import useIncident from "@/hooks/useIncident";
import api from "@/lib/api";

const ANALYSTS = [
  "Samarth",
  "Harshitha",
  "Mohith",
  "Hindushree",
  "Kumuda",
];

export default function IncidentDetails() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;

  const {
    incident,
    loading,
    error,
    refresh,
  } = useIncident(incidentId);

  const [assignedTo, setAssignedTo] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [openAIModal, setOpenAIModal] = useState(false);

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [notificationMsg, setNotificationMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmResolve, setConfirmResolve] = useState(false);

  useEffect(() => {
    if (incident?.assigned_to) {
      setAssignedTo(incident.assigned_to);
    }
  }, [incident]);

  // Load AI Summary on demand
  const loadAISummary = async () => {
    if (!incidentId) return;
    try {
      setSummaryLoading(true);
      const res = await api.get(`/ai/summary/${incidentId}`);
      setSummary(res.data.summary || "No summary available.");
    } catch {
      setSummary("AI summary temporarily unavailable.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!incident) return;
    try {
      setResolving(true);
      setNotificationMsg(null);
      await api.patch(`/incidents/${incident.id}/resolve`);
      setNotificationMsg({ type: "success", text: "Incident marked as Resolved." });
      setConfirmResolve(false);
      await refresh();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to resolve incident.";
      setNotificationMsg({ type: "error", text: typeof msg === "string" ? msg : "Failed to resolve incident." });
    } finally {
      setResolving(false);
    }
  };

  const handleAssign = async () => {
    if (!incident) return;
    if (!assignedTo.trim()) {
      setNotificationMsg({ type: "error", text: "Please select or enter an analyst name." });
      return;
    }

    try {
      setAssigning(true);
      setNotificationMsg(null);
      await api.patch(`/incidents/${incident.id}/assign`, {
        assigned_to: assignedTo.trim(),
      });
      setNotificationMsg({ type: "success", text: `Assigned to ${assignedTo.trim()} successfully!` });
      await refresh();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to assign incident.";
      setNotificationMsg({ type: "error", text: typeof msg === "string" ? msg : "Failed to assign incident." });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Top navigation */}
          <div>
            <Link
              href="/incidents"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition mb-4"
            >
              <ArrowLeft size={16} />
              Back to Incidents
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-[#0b1225] rounded-2xl border border-slate-800">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mb-4" />
              <p className="text-slate-300">Loading incident #{incidentId}...</p>
            </div>
          ) : error || !incident ? (
            <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-12 text-center space-y-4">
              <AlertTriangle className="mx-auto text-yellow-500" size={48} />
              <h2 className="text-2xl font-bold text-white">
                {error || "Incident Not Found"}
              </h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                The incident you are looking for does not exist or could not be loaded.
              </p>
              <Link
                href="/incidents"
                className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-sm transition"
              >
                Return to Incidents
              </Link>
            </div>
          ) : (
            <>
              {/* Notification Banner */}
              {notificationMsg && (
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
                    notificationMsg.type === "success"
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {notificationMsg.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    <span>{notificationMsg.text}</span>
                  </div>
                  <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Header Card */}
              <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-8 shadow-xl">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-800">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        INCIDENT #{incident.id}
                      </span>
                      <SeverityBadge severity={incident.severity} />
                      <StatusBadge status={incident.status} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                      {incident.title}
                    </h1>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setOpenAIModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition shadow-lg shadow-purple-600/20 cursor-pointer"
                    >
                      <Brain size={18} />
                      AI Investigation
                    </button>

                    {incident.status !== "Resolved" && (
                      <button
                        onClick={() => setConfirmResolve(true)}
                        disabled={resolving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition shadow-lg shadow-green-600/20 cursor-pointer disabled:bg-green-800"
                      >
                        <CheckCircle size={18} />
                        Resolve Incident
                      </button>
                    )}
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                  <div className="bg-[#111827] rounded-xl p-4 border border-slate-800/80">
                    <span className="text-xs text-slate-400 block mb-1">Source IP</span>
                    <span className="font-mono text-slate-200 font-medium">{incident.source_ip || "N/A"}</span>
                  </div>

                  <div className="bg-[#111827] rounded-xl p-4 border border-slate-800/80">
                    <span className="text-xs text-slate-400 block mb-1">Assigned Analyst</span>
                    <span className="text-slate-200 font-medium">{incident.assigned_to || "Unassigned"}</span>
                  </div>

                  <div className="bg-[#111827] rounded-xl p-4 border border-slate-800/80">
                    <span className="text-xs text-slate-400 block mb-1">Created At</span>
                    <span className="text-slate-200 text-sm">{new Date(incident.created_at).toLocaleString()}</span>
                  </div>

                  <div className="bg-[#111827] rounded-xl p-4 border border-slate-800/80">
                    <span className="text-xs text-slate-400 block mb-1">Resolved At</span>
                    <span className="text-slate-200 text-sm">
                      {incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : "Not resolved yet"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-slate-200 text-base leading-relaxed bg-[#111827] p-4 rounded-xl border border-slate-800/80">
                    {incident.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Assignment Card & AI Summary Card in a 2-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assignment Controls */}
                <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-lg font-bold text-white">
                    <UserCheck size={20} className="text-blue-400" />
                    <h2>Assign Incident</h2>
                  </div>

                  <p className="text-sm text-slate-400">
                    Delegate this incident to a SOC analyst for investigation and remediation.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="flex-1 bg-[#10192f] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">Select an Analyst...</option>
                      {ANALYSTS.map((analyst) => (
                        <option key={analyst} value={analyst}>
                          {analyst}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAssign}
                      disabled={assigning || !assignedTo}
                      className="px-6 py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white transition cursor-pointer disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      {assigning ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        "Assign"
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Quick Summary */}
                <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-bold text-white">
                      <Brain size={20} className="text-purple-400" />
                      <h2>AI Summary</h2>
                    </div>

                    <button
                      onClick={loadAISummary}
                      disabled={summaryLoading}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
                    >
                      <RefreshCw size={14} className={summaryLoading ? "animate-spin" : ""} />
                      {summary ? "Regenerate" : "Generate Summary"}
                    </button>
                  </div>

                  <div className="bg-[#111827] rounded-xl p-4 border border-slate-800/80 min-h-[100px] flex items-center text-sm text-slate-300">
                    {summaryLoading ? (
                      <div className="flex items-center gap-3 text-slate-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
                        <span>Generating AI summary...</span>
                      </div>
                    ) : summary ? (
                      <p className="leading-relaxed">{summary}</p>
                    ) : (
                      <p className="text-slate-500 italic">Click "Generate Summary" to produce an AI-assisted one-sentence overview of this incident.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Confirmation Dialog for Resolve */}
              {confirmResolve && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-[#0B1220] w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
                    <h3 className="text-xl font-bold text-white">Confirm Resolution</h3>
                    <p className="text-sm text-slate-300">
                      Marking incident <strong>#{incident.id}</strong> as resolved will record the current timestamp and update SOC dashboard metrics.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setConfirmResolve(false)}
                        className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition cursor-pointer"
                        disabled={resolving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleResolve}
                        disabled={resolving}
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition cursor-pointer disabled:bg-green-800 flex items-center gap-2"
                      >
                        {resolving ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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

              {/* AI Investigation Modal */}
              <AIInvestigationModal
                open={openAIModal}
                onClose={() => setOpenAIModal(false)}
                incident={incident}
              />
            </>
          )}
        </div>
      </div>
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
      className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
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
      className={`px-3 py-1 rounded-full text-xs font-bold ${
        status === "Resolved"
          ? "bg-green-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {status}
    </span>
  );
}
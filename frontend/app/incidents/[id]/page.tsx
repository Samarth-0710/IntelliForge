"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Brain,
  RefreshCw,
  Globe,
  Zap,
  Activity,
  Layers,
  Check,
  X,
  Play,
  Monitor,
  Flame,
  FileSearch,
  ExternalLink,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import AIInvestigationModal from "@/components/AIInvestigationModal";

import useIncident from "@/hooks/useIncident";
import api from "@/lib/api";
import { IncidentTimelineItem, AttackTechniqueItem, SOCAnalystReport } from "@/types/incident";
import { SecurityEvent } from "@/types/event";
import { ThreatIntelligenceRecord } from "@/types/threat_intel";
import { SOARAction, AutomationRun } from "@/types/automation";

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

  const { incident, loading, error, refresh } = useIncident(incidentId);

  const [activeTab, setActiveTab] = useState<"overview" | "ai" | "threat_intel" | "mitre" | "timeline" | "soar" | "events">("overview");

  const [assignedTo, setAssignedTo] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [openAIModal, setOpenAIModal] = useState(false);

  // Subsystem Telemetry Data
  const [timeline, setTimeline] = useState<IncidentTimelineItem[]>([]);
  const [techniques, setTechniques] = useState<AttackTechniqueItem[]>([]);
  const [threatIntel, setThreatIntel] = useState<ThreatIntelligenceRecord[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [soarActions, setSoarActions] = useState<SOARAction[]>([]);
  const [socReport, setSocReport] = useState<SOCAnalystReport | null>(null);

  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmResolve, setConfirmResolve] = useState(false);

  useEffect(() => {
    if (incident?.assigned_to) {
      setAssignedTo(incident.assigned_to);
    }
  }, [incident]);

  const loadAllIncidentTelemetry = async () => {
    if (!incidentId) return;
    try {
      setDataLoading(true);

      const [timelineRes, techniquesRes, intelRes, eventsRes, soarRes, aiRes] = await Promise.allSettled([
        api.get<IncidentTimelineItem[]>(`/incidents/${incidentId}/timeline`),
        api.get<AttackTechniqueItem[]>(`/incidents/${incidentId}/attack-techniques`),
        api.get<ThreatIntelligenceRecord[]>(`/incidents/${incidentId}/intelligence`),
        api.get<SecurityEvent[]>(`/incidents/${incidentId}/events`),
        api.get<SOARAction[]>(`/automation/actions/incident/${incidentId}`),
        api.get<SOCAnalystReport>(`/incidents/${incidentId}/ai-analysis`),
      ]);

      if (timelineRes.status === "fulfilled") setTimeline(timelineRes.value.data || []);
      if (techniquesRes.status === "fulfilled") setTechniques(techniquesRes.value.data || []);
      if (intelRes.status === "fulfilled") setThreatIntel(intelRes.value.data || []);
      if (eventsRes.status === "fulfilled") setEvents(eventsRes.value.data || []);
      if (soarRes.status === "fulfilled") setSoarActions(soarRes.value.data || []);
      if (aiRes.status === "fulfilled") setSocReport(aiRes.value.data);
    } catch (err) {
      console.error("Telemetry load error:", err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (incidentId) {
      loadAllIncidentTelemetry();
    }
  }, [incidentId]);

  const handleResolve = async () => {
    if (!incident) return;
    try {
      setResolving(true);
      setNotificationMsg(null);
      await api.patch(`/incidents/${incident.id}/resolve`);
      setNotificationMsg({ type: "success", text: "Incident marked as Resolved." });
      setConfirmResolve(false);
      await refresh();
      await loadAllIncidentTelemetry();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to resolve incident.";
      setNotificationMsg({ type: "error", text: typeof msg === "string" ? msg : "Failed to resolve incident." });
    } finally {
      setResolving(false);
    }
  };

  const handleEscalate = async () => {
    if (!incident) return;
    try {
      setEscalating(true);
      setNotificationMsg(null);
      await api.post(`/incidents/${incident.id}/escalate`, { reason: "Escalated by SOC Analyst for priority triage" });
      setNotificationMsg({ type: "success", text: "Incident escalated to CRITICAL priority! Automation workflows triggered." });
      await refresh();
      await loadAllIncidentTelemetry();
    } catch (err: any) {
      setNotificationMsg({ type: "error", text: "Failed to escalate incident." });
    } finally {
      setEscalating(false);
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
      setNotificationMsg({ type: "error", text: "Failed to assign incident." });
    } finally {
      setAssigning(false);
    }
  };

  const handleSOARAction = async (actionId: number, approve: boolean) => {
    try {
      setActionLoadingId(actionId);
      if (approve) {
        await api.post(`/automation/actions/${actionId}/approve`);
        setNotificationMsg({ type: "success", text: "Safe SOAR action approved and executed." });
      } else {
        await api.post(`/automation/actions/${actionId}/reject`);
        setNotificationMsg({ type: "success", text: "SOAR action rejected." });
      }
      await loadAllIncidentTelemetry();
    } catch (err: any) {
      setNotificationMsg({ type: "error", text: "Action execution failed." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const riskScore = incident?.risk_score ?? (incident?.severity === "Critical" ? 95 : incident?.severity === "High" ? 75 : incident?.severity === "Medium" ? 45 : 15);
  const confidence = incident?.confidence ?? 94;

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Back Navigation & Refresh */}
          <div className="flex items-center justify-between">
            <Link
              href="/incidents"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-400 transition"
            >
              <ArrowLeft size={16} />
              Back to Incidents Queue
            </Link>

            <button
              onClick={loadAllIncidentTelemetry}
              disabled={dataLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition"
            >
              <RefreshCw size={13} className={dataLoading ? "animate-spin" : ""} />
              <span>Refresh Telemetry</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-[#0b1225] rounded-2xl border border-slate-800">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mb-4" />
              <p className="text-slate-300 text-sm">Loading incident #{incidentId} telemetry...</p>
            </div>
          ) : error || !incident ? (
            <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-12 text-center space-y-4">
              <AlertTriangle className="mx-auto text-yellow-500" size={48} />
              <h2 className="text-2xl font-bold text-white">
                {error || "Incident Not Found"}
              </h2>
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
                  className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
                    notificationMsg.type === "success"
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {notificationMsg.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    <span>{notificationMsg.text}</span>
                  </div>
                  <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Header Hero Card */}
              <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-800/80">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                        INCIDENT #{incident.id}
                      </span>
                      {incident.correlation_id && (
                        <span className="text-xs font-mono px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          {incident.correlation_id}
                        </span>
                      )}
                      <SeverityBadge severity={incident.severity} />
                      <StatusBadge status={incident.status} />
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {incident.title}
                    </h1>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => setOpenAIModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition shadow-lg shadow-purple-600/20 cursor-pointer"
                    >
                      <Brain size={15} />
                      AI Copilot
                    </button>

                    {incident.severity !== "Critical" && incident.status !== "Resolved" && (
                      <button
                        onClick={handleEscalate}
                        disabled={escalating}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-semibold text-xs transition shadow-lg shadow-red-600/20 cursor-pointer disabled:bg-slate-700"
                      >
                        <Flame size={15} />
                        {escalating ? "Escalating..." : "Escalate to Critical"}
                      </button>
                    )}

                    {incident.status !== "Resolved" && (
                      <button
                        onClick={() => setConfirmResolve(true)}
                        disabled={resolving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs transition shadow-lg shadow-green-600/20 cursor-pointer disabled:bg-green-800"
                      >
                        <CheckCircle size={15} />
                        Resolve Incident
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Metrics: Risk Score, Confidence, Endpoint, Source IP */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                  {/* Risk Score */}
                  <div className="bg-[#111827] rounded-xl p-4 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider mb-1">
                      Risk Score
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold font-mono ${riskScore >= 75 ? "text-red-400" : riskScore >= 50 ? "text-orange-400" : "text-green-400"}`}>
                        {riskScore}/100
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{incident.severity}</span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="bg-[#111827] rounded-xl p-4 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider mb-1">
                      Detection Confidence
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-purple-400">
                        {confidence}%
                      </span>
                      <span className="text-[10px] text-slate-400">Verified</span>
                    </div>
                  </div>

                  {/* Endpoint */}
                  <div className="bg-[#111827] rounded-xl p-4 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider mb-1">
                      Target Endpoint
                    </span>
                    <span className="font-bold text-white text-sm block truncate">
                      {incident.endpoint_id || "Mohith-PC"}
                    </span>
                  </div>

                  {/* Source IP */}
                  <div className="bg-[#111827] rounded-xl p-4 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider mb-1">
                      Originating Source
                    </span>
                    <span className="font-mono text-slate-200 text-sm font-semibold block truncate">
                      {incident.source_ip || "Internal Host"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                    activeTab === "overview" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileSearch size={14} />
                  Overview & Telemetry
                </button>

                <button
                  onClick={() => setActiveTab("ai")}
                  className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                    activeTab === "ai" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Brain size={14} />
                  AI SOC Analyst
                </button>

                <button
                  onClick={() => setActiveTab("threat_intel")}
                  className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                    activeTab === "threat_intel" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Globe size={14} />
                  Tavily Threat Intel ({threatIntel.length})
                </button>

                <button
                  onClick={() => setActiveTab("mitre")}
                  className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                    activeTab === "mitre" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers size={14} />
                  MITRE ATT&CK ({techniques.length})
                </button>

                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                    activeTab === "timeline" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Clock size={14} />
                  Chronological Timeline ({timeline.length})
                </button>

                <button
                  onClick={() => setActiveTab("soar")}
                  className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                    activeTab === "soar" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Zap size={14} />
                  Safe SOAR & Automation ({soarActions.length})
                </button>

                <button
                  onClick={() => setActiveTab("events")}
                  className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                    activeTab === "events" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Activity size={14} />
                  Related Events ({events.length})
                </button>
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Details */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                        Incident Description & Scope
                      </h3>
                      <p className="text-sm text-slate-200 leading-relaxed bg-[#111827] p-4 rounded-xl border border-slate-800/80">
                        {incident.description || "No description provided."}
                      </p>
                    </div>

                    {/* AI Quick Synthesis */}
                    {socReport && (
                      <div className="bg-[#0b1225] rounded-2xl border border-purple-500/30 p-6 space-y-4">
                        <div className="flex items-center gap-2 text-purple-400">
                          <Brain size={20} />
                          <h3 className="text-sm font-bold uppercase tracking-wider">
                            AI SOC Analyst Assessment
                          </h3>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed bg-[#111827] p-4 rounded-xl border border-purple-500/20">
                          {socReport.assessment}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Assignment & Quick Meta */}
                  <div className="space-y-6">
                    <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <UserCheck size={18} className="text-blue-400" />
                        <h3>Assign Incident</h3>
                      </div>
                      <div className="space-y-3">
                        <select
                          value={assignedTo}
                          onChange={(e) => setAssignedTo(e.target.value)}
                          className="w-full bg-[#10192f] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none"
                        >
                          <option value="">Select Analyst...</option>
                          {ANALYSTS.map((a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleAssign}
                          disabled={assigning || !assignedTo}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:bg-slate-700"
                        >
                          {assigning ? "Saving..." : "Save Assignment"}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 space-y-3 text-xs">
                      <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        Lifecycle Telemetry
                      </h4>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Created:</span>
                        <span className="text-slate-200 font-mono">{new Date(incident.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Resolved:</span>
                        <span className="text-slate-200 font-mono">{incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : "Active"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Assignee:</span>
                        <span className="text-slate-200">{incident.assigned_to || "Unassigned"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AI SOC ANALYST */}
              {activeTab === "ai" && (
                <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Brain size={22} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          AI SOC Level-3 Analyst Report
                        </h2>
                        <p className="text-xs text-slate-400">
                          Automated reasoning, evidence extraction, and response recommendations
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30">
                        Confidence: {socReport?.confidence || 95}%
                      </span>
                    </div>
                  </div>

                  {socReport ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Analyst Assessment
                        </h4>
                        <p className="text-sm text-slate-200 leading-relaxed bg-[#111827] p-5 rounded-xl border border-slate-800">
                          {socReport.assessment}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Evidence Checklist */}
                        <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-3">
                          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle size={15} /> Observed Evidence
                          </h4>
                          <ul className="space-y-2 text-xs text-slate-300">
                            {socReport.evidence.map((ev, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommended Remediation */}
                        <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-3">
                          <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap size={15} /> Actionable Recommendations
                          </h4>
                          <ul className="space-y-2 text-xs text-slate-300">
                            {socReport.recommended_actions.map((act, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-400 font-bold">{i + 1}.</span>
                                <span>{act.replace(/^[0-9]+\.\s*/, '')}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      AI SOC Analyst assessment loading...
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TAVILY THREAT INTEL */}
              {activeTab === "threat_intel" && (
                <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        <Globe size={22} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          Tavily Real-Time Threat Intelligence
                        </h2>
                        <p className="text-xs text-slate-400">
                          External IOC reputation, threat actor feeds, and web citations
                        </p>
                      </div>
                    </div>
                  </div>

                  {threatIntel.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No external threat indicators recorded for this incident.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {threatIntel.map((ti, i) => (
                        <div key={i} className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-white">{ti.indicator}</span>
                              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">{ti.indicator_type}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded font-bold uppercase text-[11px] ${
                              ti.verdict === "Known Malicious"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : ti.verdict === "Suspicious"
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                : "bg-green-500/20 text-green-400 border border-green-500/30"
                            }`}>
                              Verdict: {ti.verdict}
                            </span>
                          </div>

                          <p className="text-slate-300 leading-relaxed">
                            {ti.summary}
                          </p>

                          {ti.sources && ti.sources.length > 0 && (
                            <div className="pt-2 border-t border-slate-800">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Intelligence Citations:</span>
                              <div className="flex flex-wrap gap-2">
                                {ti.sources.map((src, idx) => (
                                  <a
                                    key={idx}
                                    href={src}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 hover:underline text-[11px] flex items-center gap-1"
                                  >
                                    <ExternalLink size={11} />
                                    <span>Source {idx + 1}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: MITRE ATT&CK */}
              {activeTab === "mitre" && (
                <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        <Layers size={22} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          MITRE ATT&CK Framework Mapping
                        </h2>
                        <p className="text-xs text-slate-400">
                          Evidence-based tactics, techniques, and adversary behavior classification
                        </p>
                      </div>
                    </div>
                  </div>

                  {techniques.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No MITRE ATT&CK techniques mapped for this incident.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {techniques.map((t) => (
                        <div key={t.id} className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-orange-400">
                              {t.technique_id}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                              {t.tactic}
                            </span>
                          </div>

                          <h4 className="font-bold text-white text-sm">
                            {t.technique_name}
                          </h4>

                          <p className="text-slate-300 text-xs leading-relaxed bg-[#0b1225] p-3 rounded-lg border border-slate-800">
                            {t.evidence}
                          </p>

                          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                            <span>Confidence: {t.confidence}%</span>
                            <span>Mapped: {new Date(t.detected_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CHRONOLOGICAL TIMELINE */}
              {activeTab === "timeline" && (
                <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        <Clock size={22} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          Incident Lifecycle Timeline
                        </h2>
                        <p className="text-xs text-slate-400">
                          Complete chronological detection-to-resolution event sequence
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {timeline.map((entry, idx) => (
                      <div key={entry.id || idx} className="relative space-y-1">
                        <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-[#0b1225]" />
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-blue-400 font-bold">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {entry.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                            {entry.actor}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 pl-0.5">
                          {entry.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: SOAR & AUTOMATION */}
              {activeTab === "soar" && (
                <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30">
                        <Zap size={22} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          Safe SOAR Response & Action Center
                        </h2>
                        <p className="text-xs text-slate-400">
                          Human-in-the-Loop approval gate for containment and remediation actions
                        </p>
                      </div>
                    </div>
                  </div>

                  {soarActions.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No SOAR actions proposed yet for this incident.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {soarActions.map((act) => (
                        <div key={act.id} className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{act.action_type.replace('_', ' ').toUpperCase()}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                act.status === "Executed" ? "bg-green-500/20 text-green-400" : act.status === "Proposed" ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-400"
                              }`}>
                                {act.status}
                              </span>
                              {act.is_destructive && (
                                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                                  REQUIRES HUMAN APPROVAL
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300">
                              Target: <strong className="text-white font-mono">{act.target}</strong> &bull; {act.reason}
                            </p>
                            {act.execution_result && (
                              <p className="text-green-400 font-mono text-[11px] pt-1">
                                &rarr; {act.execution_result}
                              </p>
                            )}
                          </div>

                          {act.status === "Proposed" && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleSOARAction(act.id, true)}
                                disabled={actionLoadingId === act.id}
                                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs transition flex items-center gap-1 shadow cursor-pointer disabled:bg-green-800"
                              >
                                <Check size={14} />
                                <span>Approve & Execute</span>
                              </button>

                              <button
                                onClick={() => handleSOARAction(act.id, false)}
                                disabled={actionLoadingId === act.id}
                                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                              >
                                <X size={14} />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: RELATED SECURITY EVENTS */}
              {activeTab === "events" && (
                <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-6 md:p-8 space-y-4">
                  <h2 className="text-lg font-bold text-white pb-3 border-b border-slate-800">
                    Correlated Security Events ({events.length})
                  </h2>

                  {events.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No raw security events linked.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-400 border-b border-slate-800 uppercase tracking-wider pb-2">
                            <th className="pb-2">Event</th>
                            <th className="pb-2">User</th>
                            <th className="pb-2">Hostname</th>
                            <th className="pb-2">Source IP</th>
                            <th className="pb-2">Severity</th>
                            <th className="pb-2">Risk</th>
                            <th className="pb-2">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((ev) => (
                            <tr key={ev.id} className="border-b border-slate-800/60 hover:bg-[#111c38]">
                              <td className="py-3 font-semibold text-white">{ev.event_type} {ev.event_id ? `(${ev.event_id})` : ""}</td>
                              <td className="py-3 text-slate-300">{ev.username || "SYSTEM"}</td>
                              <td className="py-3 text-slate-300">{ev.hostname || "N/A"}</td>
                              <td className="py-3 text-slate-300 font-mono">{ev.source_ip || "Internal"}</td>
                              <td className="py-3"><SeverityBadge severity={ev.severity} /></td>
                              <td className="py-3 font-mono font-bold text-orange-400">{ev.risk_score}</td>
                              <td className="py-3 text-slate-400 whitespace-nowrap">{new Date(ev.timestamp).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Confirmation Dialog for Resolve */}
              {confirmResolve && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-[#0B1220] w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
                    <h3 className="text-lg font-bold text-white">Confirm Resolution</h3>
                    <p className="text-xs text-slate-300">
                      Marking incident <strong>#{incident.id}</strong> as resolved will record resolution in the audit log and send a resolution alert.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setConfirmResolve(false)}
                        className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition cursor-pointer"
                        disabled={resolving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleResolve}
                        disabled={resolving}
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition cursor-pointer disabled:bg-green-800 flex items-center gap-2"
                      >
                        {resolving ? "Resolving..." : "Confirm Resolve"}
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
          ? "bg-green-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {status}
    </span>
  );
}
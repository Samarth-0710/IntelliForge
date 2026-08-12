"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { SOARAction, AutomationRun } from "@/types/automation";
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  ShieldAlert,
  Clock,
  Play,
} from "lucide-react";

export default function AutomationPage() {
  const [actions, setActions] = useState<SOARAction[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [actionsRes, runsRes] = await Promise.allSettled([
        api.get<SOARAction[]>("/automation/actions"),
        api.get<AutomationRun[]>("/automation/runs"),
      ]);

      if (actionsRes.status === "fulfilled") setActions(actionsRes.value.data || []);
      if (runsRes.status === "fulfilled") setRuns(runsRes.value.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSOARAction = async (actionId: number, approve: boolean) => {
    try {
      setActionLoadingId(actionId);
      if (approve) {
        await api.post(`/automation/actions/${actionId}/approve`);
        setNotification("SOAR Action approved and executed successfully.");
      } else {
        await api.post(`/automation/actions/${actionId}/reject`);
        setNotification("SOAR Action rejected.");
      }
      await loadData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingActions = actions.filter((a) => a.status === "Proposed");
  const pastActions = actions.filter((a) => a.status !== "Proposed");

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
                <Zap className="text-green-400" />
                SOAR & n8n Automation Engine
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Automated security playbooks, webhook orchestrators, and Safe SOAR human-in-the-loop response actions
              </p>
            </div>

            <button
              onClick={loadData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition self-start md:self-auto"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {notification && (
            <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{notification}</span>
            </div>
          )}

          {/* Section 1: Pending Human-in-the-Loop Approval Queue */}
          <div className="bg-[#0b1225] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-ping" />
                <h2 className="text-base font-bold text-white">
                  Pending Human Approval Queue ({pendingActions.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Destructive containment actions require human authorization
              </span>
            </div>

            {pendingActions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No containment actions currently pending human review.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingActions.map((act) => (
                  <div
                    key={act.id}
                    className="bg-[#111827] rounded-xl p-5 border border-yellow-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {act.action_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold uppercase text-[10px]">
                          APPROVAL REQUIRED
                        </span>
                        <span className="text-slate-400">Incident #{act.incident_id}</span>
                      </div>
                      <p className="text-slate-300">
                        Target: <strong className="text-white font-mono">{act.target}</strong> &bull; Reason: {act.reason}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Proposed by {act.proposed_by} at {new Date(act.created_at).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSOARAction(act.id, true)}
                        disabled={actionLoadingId === act.id}
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow cursor-pointer disabled:bg-green-800"
                      >
                        <Check size={14} />
                        <span>Authorize Execution</span>
                      </button>

                      <button
                        onClick={() => handleSOARAction(act.id, false)}
                        disabled={actionLoadingId === act.id}
                        className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Automation & Response History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action History */}
            <div className="bg-[#0b1225] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                Executed Response Actions ({pastActions.length})
              </h2>

              {pastActions.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No historical response actions recorded.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto">
                  {pastActions.map((act) => (
                    <div key={act.id} className="p-3 bg-[#111827] rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{act.action_type.replace('_', ' ').toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          act.status === "Executed" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {act.status}
                        </span>
                      </div>
                      <p className="text-slate-300">Target: {act.target}</p>
                      {act.execution_result && (
                        <p className="text-green-400 font-mono text-[11px]">&rarr; {act.execution_result}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* n8n Workflows History */}
            <div className="bg-[#0b1225] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                n8n Webhook Playbook Runs ({runs.length})
              </h2>

              {runs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No n8n playbook runs triggered yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto">
                  {runs.map((r) => (
                    <div key={r.id} className="p-3 bg-[#111827] rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{r.workflow_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
                          {r.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Trigger: {r.trigger_type} &bull; Triggered at: {new Date(r.triggered_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

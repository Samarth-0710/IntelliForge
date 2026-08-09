"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  incident: any;
}

export default function AIInvestigationModal({
  open,
  onClose,
  incident,
}: Props) {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedIncidentId = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !incident) {
      return;
    }

    // Only load if we haven't loaded for this incident yet
    if (fetchedIncidentId.current === incident.id && analysis) {
      return;
    }

    async function loadInvestigation() {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/ai/investigate/${incident.id}`);
        setAnalysis(res.data.analysis || "No analysis details generated.");
        fetchedIncidentId.current = incident.id;
      } catch (err: any) {
        console.error("AI Investigation error:", err);
        setError("AI quota temporarily reached or analysis unavailable. Please try again later.");
        setAnalysis("");
      } finally {
        setLoading(false);
      }
    }

    loadInvestigation();
  }, [open, incident, analysis]);

  if (!open || !incident) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0B1220] w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B1220] flex justify-between items-center px-6 py-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              🤖
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                AI Incident Investigation
              </h2>
              <p className="text-xs text-slate-400">
                Powered by Gemini 2.5 Flash Security Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div>
            <span className="text-xs font-mono text-slate-400">
              TARGET INCIDENT #{incident.id}
            </span>
            <h3 className="text-2xl font-bold text-white mt-1">
              {incident.title}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card title="Severity" value={incident.severity} />
            <Card title="Status" value={incident.status} />
            <Card title="Source IP" value={incident.source_ip || "N/A"} />
          </div>

          {/* AI Report Box */}
          <div className="rounded-xl bg-[#111827] border border-slate-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🧠</span> Autonomous SOC Analysis Report
              </h4>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
                <span className="text-slate-300 text-sm">
                  Gemini is analyzing threat vectors and root cause...
                </span>
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
                {error}
              </div>
            ) : (
              <div className="rounded-lg bg-[#0B1220] border border-slate-800 p-5">
                <div className="whitespace-pre-wrap leading-relaxed text-slate-200 text-sm font-sans">
                  {analysis}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end shrink-0 bg-[#0B1220]">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white transition px-6 py-2.5 rounded-xl font-semibold text-sm cursor-pointer shadow-lg shadow-blue-600/20"
          >
            Close Investigation
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-[#111827] rounded-xl border border-slate-800 p-4">
      <p className="text-slate-400 text-xs uppercase tracking-wider">
        {title}
      </p>
      <h5 className="text-lg font-bold text-white mt-1">
        {value}
      </h5>
    </div>
  );
}
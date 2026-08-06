"use client";

import { useEffect, useState } from "react";
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
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !incident) return;

    async function loadInvestigation() {
      setLoading(true);

      try {
        const res = await api.get(
          `/ai/investigate/${incident.id}`
        );

        setAnalysis(res.data.analysis);
      } catch (err) {
        console.error(err);

        setAnalysis(
          "Unable to generate AI investigation."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInvestigation();
  }, [open, incident]);

  if (!open || !incident) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-[#0B1220] w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 shadow-2xl">

        {/* Header */}

        <div className="sticky top-0 bg-[#0B1220] flex justify-between items-center p-6 border-b border-slate-700">

          <h2 className="text-3xl font-bold">
            🤖 AI Investigation
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-slate-400 hover:text-white"
          >
            ✕
          </button>

        </div>

        {/* Body */}

        <div className="p-6 space-y-6">

          <div>

            <p className="text-slate-400">
              Incident
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {incident.title}
            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-4">

            <Card
              title="Severity"
              value={incident.severity}
            />

            <Card
              title="Status"
              value={incident.status}
            />

            <Card
              title="Source IP"
              value={incident.source_ip}
            />

          </div>

          {/* AI Report */}

          <div className="rounded-xl bg-[#111827] border border-slate-700 p-5">

            <h3 className="text-2xl font-bold mb-4">
              🧠 AI Investigation Report
            </h3>

            {loading ? (

              <div className="flex items-center gap-4 py-10">

                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>

                <span className="text-slate-300">
                  Gemini is investigating...
                </span>

              </div>

            ) : (

              <div className="max-h-72 overflow-y-auto rounded-lg bg-[#0B1220] border border-slate-700 p-5">

                <div className="whitespace-pre-wrap leading-7 text-slate-300 text-[15px]">
                  {analysis}
                </div>

              </div>

            )}

          </div>

          <div className="flex justify-end">

            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 transition px-8 py-3 rounded-xl font-semibold"
            >
              Close
            </button>

          </div>

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
    <div className="bg-[#111827] rounded-xl border border-slate-700 p-5">

      <p className="text-slate-400 text-sm">
        {title}
      </p>

      <h3 className="text-2xl font-bold mt-2">
        {value}
      </h3>

    </div>
  );
}
"use client";

import { useState } from "react";

import useIncidents from "@/hooks/useIncidents";
import AIInvestigationModal from "@/components/AIInvestigationModal";

export default function IncidentTable() {

  const { incidents, loading } = useIncidents();

  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);

  if (loading) {
    return (
      <div className="bg-[#111827] rounded-xl p-6">
        Loading incidents...
      </div>
    );
  }

  return (
    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800 shadow-xl">

      <h2 className="text-2xl font-bold mb-6">
        Recent Incidents
      </h2>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="text-left text-gray-400 border-b border-gray-700">

              <th className="pb-4">Title</th>

              <th className="pb-4">Severity</th>

              <th className="pb-4">Status</th>

              <th className="pb-4">Source IP</th>

              <th className="pb-4">AI Summary</th>

              <th className="pb-4">Created</th>

              <th className="pb-4 text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {incidents.map((incident) => (

              <tr
                key={incident.id}
                className="border-b border-gray-800 hover:bg-[#1a2335] transition duration-300"
              >

                <td className="py-5 font-semibold">
                  {incident.title}
                </td>

                <td className="py-5">
                  <SeverityBadge severity={incident.severity} />
                </td>

                <td className="py-5">
                  <StatusBadge status={incident.status} />
                </td>

                <td className="py-5 text-gray-300">
                  {incident.source_ip}
                </td>

                <td className="py-5 max-w-[220px] text-slate-300">
                  {incident.ai_summary || "No summary"}
                </td>

                <td className="py-5 text-gray-400 whitespace-nowrap">
                  {new Date(
                    incident.created_at
                  ).toLocaleString()}
                </td>

                <td className="py-5">

                  <div className="flex items-center justify-center gap-2">

                    <button
                      onClick={() =>
                        alert(`Viewing: ${incident.title}`)
                      }
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-sm"
                    >
                      👁 View
                    </button>

                    <button
                      onClick={() =>
                        alert(`Resolve: ${incident.title}`)
                      }
                      className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition text-sm"
                    >
                      ✅ Resolve
                    </button>

                    <button
                      onClick={() => {
                        setSelectedIncident(incident);
                        setOpenModal(true);
                      }}
                      className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition text-sm"
                    >
                      🤖 AI
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <AIInvestigationModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        incident={selectedIncident}
      />

    </div>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: string;
}) {

  const colors: Record<string, string> = {
    Critical: "bg-red-600",
    High: "bg-orange-500",
    Medium: "bg-yellow-500 text-black",
    Low: "bg-green-500",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${
        colors[severity] || "bg-gray-600"
      }`}
    >
      {severity}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${
        status === "Resolved"
          ? "bg-green-600"
          : "bg-red-600"
      }`}
    >
      {status}
    </span>
  );
}
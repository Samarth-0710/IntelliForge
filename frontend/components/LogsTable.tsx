"use client";

import useLogs from "@/hooks/useLogs";

function severityColor(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-red-600";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500 text-black";
    case "low":
      return "bg-green-600";
    default:
      return "bg-slate-600";
  }
}

function riskColor(score: number) {
  if (score >= 80) return "bg-red-600";
  if (score >= 50) return "bg-yellow-500 text-black";
  return "bg-green-600";
}

export default function LogsTable() {
  const { logs, loading } = useLogs();

  if (loading) {
    return (
      <div className="text-white text-lg">
        Loading logs...
      </div>
    );
  }

  return (
    <div className="bg-[#0b1225] rounded-xl p-6 shadow-lg">

      <h2 className="text-3xl font-bold mb-6">
        Security Logs
      </h2>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="border-b border-slate-700 text-slate-400">
            <tr className="text-left">
              <th className="pb-4">Event</th>
              <th className="pb-4">User</th>
              <th className="pb-4">Source</th>
              <th className="pb-4">IP Address</th>
              <th className="pb-4">Severity</th>
              <th className="pb-4">Risk</th>
              <th className="pb-4">AI Summary</th>
              <th className="pb-4">Time</th>
            </tr>
          </thead>

          <tbody>

            {logs.map((log) => (

              <tr
                key={log.id}
                className="border-b border-slate-800 hover:bg-slate-900 transition"
              >

                <td className="py-5 font-medium">
                  {log.event_type}
                </td>

                <td>
                  {log.username}
                </td>

                <td>
                  {log.source}
                </td>

                <td>
                  {log.ip_address}
                </td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-sm text-white ${severityColor(
                      log.severity
                    )}`}
                  >
                    {log.severity}
                  </span>
                </td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${riskColor(
                      log.risk_score
                    )}`}
                  >
                    {log.risk_score}
                  </span>
                </td>

                <td className="min-w-[320px]">

                  <div className="group relative">

                    <p className="truncate cursor-pointer text-slate-300">
                      {log.ai_summary
                        ? `${log.ai_summary.substring(0, 80)}...`
                        : "No AI analysis"}
                    </p>

                    {log.ai_summary && (

                      <div
                        className="
                          invisible
                          opacity-0
                          group-hover:visible
                          group-hover:opacity-100
                          transition-all
                          duration-200

                          absolute
                          left-0
                          top-8
                          z-50

                          w-[600px]
                          max-h-[400px]
                          overflow-y-auto

                          rounded-xl
                          border
                          border-slate-700
                          bg-[#111827]

                          p-5
                          shadow-2xl

                          text-sm
                          text-slate-200

                          whitespace-pre-wrap
                        "
                      >
                        {log.ai_summary}
                      </div>

                    )}

                  </div>

                </td>

                <td className="text-slate-400">
                  {new Date(log.timestamp).toLocaleString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
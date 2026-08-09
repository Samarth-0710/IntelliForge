"use client";

import useLogs from "@/hooks/useLogs";

function severityColor(severity: string) {
  switch ((severity || "").toLowerCase()) {
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
  const { logs, loading, refresh } = useLogs();

  if (loading) {
    return (
      <div className="bg-[#0b1225] rounded-xl p-8 shadow-lg flex items-center justify-center gap-3 text-slate-300">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
        <span>Loading logs...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0b1225] rounded-xl p-6 shadow-lg border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          Security Event Logs
        </h2>
        <span className="text-sm text-slate-400">
          {logs.length} total events
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          <p className="text-lg">No security logs recorded.</p>
          <p className="text-xs text-slate-600 mt-1">Logs sent to the ingestion endpoint will appear here automatically.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700 text-slate-400">
              <tr className="text-left text-xs uppercase tracking-wider">
                <th className="pb-4 font-semibold">Event</th>
                <th className="pb-4 font-semibold">User</th>
                <th className="pb-4 font-semibold">Source</th>
                <th className="pb-4 font-semibold">IP Address</th>
                <th className="pb-4 font-semibold">Severity</th>
                <th className="pb-4 font-semibold">Risk Score</th>
                <th className="pb-4 font-semibold">AI Summary</th>
                <th className="pb-4 font-semibold">Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-800/80 hover:bg-[#111c36] transition"
                >
                  <td className="py-4 font-semibold text-white">
                    {log.event_type}
                  </td>

                  <td className="py-4 text-slate-300">
                    {log.username || "system"}
                  </td>

                  <td className="py-4 text-slate-300">
                    {log.source}
                  </td>

                  <td className="py-4 text-slate-300 font-mono text-xs">
                    {log.ip_address || "N/A"}
                  </td>

                  <td className="py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${severityColor(
                        log.severity
                      )}`}
                    >
                      {log.severity}
                    </span>
                  </td>

                  <td className="py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${riskColor(
                        log.risk_score
                      )}`}
                    >
                      {log.risk_score}
                    </span>
                  </td>

                  <td className="py-4 min-w-[280px]">
                    <div className="group relative">
                      <p className="truncate cursor-pointer text-slate-300 text-xs leading-relaxed max-w-[280px]">
                        {log.ai_summary || "AI analysis completed."}
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
                            w-[450px]
                            max-h-[300px]
                            overflow-y-auto
                            rounded-xl
                            border
                            border-slate-700
                            bg-[#111827]
                            p-4
                            shadow-2xl
                            text-xs
                            text-slate-200
                            whitespace-pre-wrap
                          "
                        >
                          {log.ai_summary}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-4 text-slate-400 whitespace-nowrap text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
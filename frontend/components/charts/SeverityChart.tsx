"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import useDashboard, { DashboardStats } from "@/hooks/useDashboard";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
};

const DEFAULT_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

interface SeverityChartProps {
  stats?: DashboardStats;
}

export default function SeverityChart({ stats: propStats }: SeverityChartProps) {
  const hookResult = useDashboard();
  const stats = propStats || hookResult.stats;

  const data = stats.severity_distribution || [];

  return (
    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          Severity Distribution
        </h2>
        <span className="text-xs text-slate-400">
          By severity level
        </span>
      </div>

      <div className="h-[280px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            No severity data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="severity"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={4}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={SEVERITY_COLORS[entry.severity] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#374151",
                  borderRadius: "0.75rem",
                  color: "#F9FAFB",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "#9CA3AF" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
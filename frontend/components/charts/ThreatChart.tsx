"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import useDashboard, { DashboardStats } from "@/hooks/useDashboard";

interface ThreatChartProps {
  stats?: DashboardStats;
}

export default function ThreatChart({ stats: propStats }: ThreatChartProps) {
  const hookResult = useDashboard();
  const stats = propStats || hookResult.stats;

  const data = stats.threat_trend || [];

  return (
    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          Threat Trend (7 Days)
        </h2>
        <span className="text-xs text-slate-400">
          Daily incident volume
        </span>
      </div>

      <div className="h-[280px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            No incident trends recorded in the last 7 days.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                tickLine={false}
              />

              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                tickLine={false}
                allowDecimals={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#374151",
                  borderRadius: "0.75rem",
                  color: "#F9FAFB",
                  fontSize: "12px",
                }}
              />

              <Line
                type="monotone"
                dataKey="count"
                name="Incidents"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", r: 4 }}
                activeDot={{ r: 6, fill: "#60A5FA" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
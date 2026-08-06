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

import useDashboard from "@/hooks/useDashboard";

export default function ThreatChart() {
  const { stats } = useDashboard();

  return (
    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">
      <h2 className="text-xl font-bold mb-6">
        Threat Trend
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={stats.threat_trend}>
          <CartesianGrid stroke="#374151" />

          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
          />

          <YAxis stroke="#9CA3AF" />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="count"
            stroke="#3B82F6"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
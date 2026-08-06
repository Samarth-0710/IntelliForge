"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import useDashboard from "@/hooks/useDashboard";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
];

export default function SeverityChart() {
  const { stats } = useDashboard();

  return (
    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">
      <h2 className="text-xl font-bold mb-6">
        Severity Distribution
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={stats.severity_distribution}
            dataKey="count"
            nameKey="severity"
            outerRadius={110}
            label
          >
            {stats.severity_distribution.map(
              (_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              )
            )}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
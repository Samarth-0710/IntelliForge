"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
];

interface Props {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export default function ThreatDistribution({
  critical,
  high,
  medium,
  low,
}: Props) {

  const data = [
    { name: "Critical", value: critical },
    { name: "High", value: high },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
  ];

  return (
    <div className="rounded-2xl bg-[#0b1225] border border-slate-700 p-8">

      <h2 className="text-2xl font-bold mb-8">
        🥧 Threat Distribution
      </h2>

      <div className="h-[320px]">

        <ResponsiveContainer>

          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              innerRadius={65}
              outerRadius={110}
              paddingAngle={4}
            >

              {data.map((entry, index) => (

                <Cell
                  key={index}
                  fill={COLORS[index]}
                />

              ))}

            </Pie>

            <Tooltip />

            <Legend />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}
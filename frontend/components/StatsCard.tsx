import { ReactNode } from "react";

type Props = {
  title: string;
  value: string;
  icon: ReactNode;
  color: "red" | "green" | "blue" | "orange";
};

const colors = {
  red: "bg-red-500/20 text-red-400",
  green: "bg-green-500/20 text-green-400",
  blue: "bg-blue-500/20 text-blue-400",
  orange: "bg-orange-500/20 text-orange-400",
};

export default function StatsCard({
  title,
  value,
  icon,
  color,
}: Props) {
  return (
    <div className="bg-[#0B1220] rounded-2xl border border-slate-800 p-6 hover:border-blue-500 transition">

      <div className="flex justify-between items-center">

        <div>

          <p className="text-slate-400 text-sm">
            {title}
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {value}
          </h2>

        </div>

        <div
          className={`w-16 h-16 rounded-xl flex items-center justify-center ${colors[color]}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}
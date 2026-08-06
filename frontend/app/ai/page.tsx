"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import useAI from "@/hooks/useAI";
import ThreatDistribution from "@/components/ThreatDistribution";
import AICopilot from "@/components/AICopilot";

function levelColor(level: string) {
  switch (level.toLowerCase()) {
    case "high":
      return "text-red-400";
    case "medium":
      return "text-yellow-400";
    default:
      return "text-green-400";
  }
}

function meterColor(score: number) {
  if (score >= 80) return "bg-red-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-green-500";
}

export default function AIPage() {
  const { data, loading } = useAI();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-500 mx-auto"></div>
          <h2 className="text-white text-2xl mt-6">
            AI Threat Center
          </h2>
          <p className="text-slate-400 mt-2">
            Loading intelligence...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center text-white">
        Unable to load AI Dashboard
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">

      <Sidebar />

      <div className="flex-1">

        <Navbar />

        <div className="p-8">

          {/* Hero */}

          <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-[#0B1220] via-[#111C36] to-[#0B1220] p-10 shadow-2xl">

            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl"></div>

            <h1 className="text-5xl font-black tracking-wide">
              🤖 AI Threat Center
            </h1>

            <p className="text-slate-400 text-lg mt-3">
              Powered by Gemini AI & IntelliForge Risk Engine
            </p>

            <div className="mt-8 flex items-center gap-4">

              <span className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                ● System Online
              </span>

              <span className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                AI Active
              </span>

            </div>

          </div>

          {/* KPI Cards */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

            <div className="rounded-2xl bg-[#0b1225] border border-slate-700 p-6 hover:border-red-500 hover:scale-105 transition-all">

              <p className="text-slate-400">
                Threat Level
              </p>

              <h2 className={`text-4xl font-bold mt-3 ${levelColor(data.threat_level)}`}>
                {data.threat_level}
              </h2>

            </div>

            <div className="rounded-2xl bg-[#0b1225] border border-slate-700 p-6 hover:border-orange-500 hover:scale-105 transition-all">

              <p className="text-slate-400">
                Highest Risk
              </p>

              <h2 className="text-4xl font-bold text-red-400 mt-3">
                {data.highest_risk}
              </h2>

            </div>

            <div className="rounded-2xl bg-[#0b1225] border border-slate-700 p-6 hover:border-green-500 hover:scale-105 transition-all">

              <p className="text-slate-400">
                Total Logs
              </p>

              <h2 className="text-4xl font-bold text-green-400 mt-3">
                {data.total_logs}
              </h2>

            </div>

            <div className="rounded-2xl bg-[#0b1225] border border-slate-700 p-6 hover:border-yellow-500 hover:scale-105 transition-all">

              <p className="text-slate-400">
                Open Incidents
              </p>

              <h2 className="text-4xl font-bold text-yellow-400 mt-3">
                {data.open_incidents}
              </h2>

            </div>

          </div>

          {/* Recommendation + Meter */}

          <div className="grid xl:grid-cols-2 gap-8 mt-10">

            <div className="rounded-2xl bg-[#0b1225] border border-slate-700 p-8">

              <h2 className="text-2xl font-bold mb-6">
                🧠 AI Recommendation
              </h2>

              <div className="rounded-xl bg-[#111827] border border-slate-700 p-6">

                <p className="text-slate-300 text-lg leading-8">
                  {data.recommendation}
                </p>

              </div>

            </div>

            <div className="rounded-2xl bg-[#0b1225] border border-slate-700 p-8">

              <h2 className="text-2xl font-bold mb-6">
                🚨 Threat Meter
              </h2>

              <div className="w-full h-8 bg-slate-800 rounded-full overflow-hidden">

                <div
                  className={`${meterColor(data.highest_risk)} h-full transition-all duration-1000`}
                  style={{
                    width: `${data.highest_risk}%`,
                  }}
                />

              </div>

              <div className="flex justify-between mt-5">

                <span className="text-slate-400">
                  Low
                </span>

                <span className="text-3xl font-bold">
                  {data.highest_risk}%
                </span>

                <span className="text-slate-400">
                  Critical
                </span>

              </div>

            </div>

          </div>

          {/* PART 2 STARTS HERE */}
          {/* Intelligence Cards */}

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-10">

  {/* Top Attack */}

  <div className="rounded-2xl bg-[#0b1225] border border-slate-700 p-8 hover:border-red-500 hover:scale-[1.02] transition-all">

    <div className="text-5xl mb-5">🎯</div>

    <p className="text-slate-400">
      Most Common Attack
    </p>

    <h2 className="text-3xl font-bold mt-4">
      {data.top_attack}
    </h2>

  </div>

  {/* Top User */}

  <div className="rounded-2xl bg-[#0b1225] border border-slate-700 p-8 hover:border-green-500 hover:scale-[1.02] transition-all">

    <div className="text-5xl mb-5">👤</div>

    <p className="text-slate-400">
      Most Targeted User
    </p>

    <h2 className="text-3xl font-bold mt-4 text-green-400">
      {data.top_user}
    </h2>

  </div>

  {/* Top IP */}

  <div className="rounded-2xl bg-[#0b1225] border border-slate-700 p-8 hover:border-blue-500 hover:scale-[1.02] transition-all">

    <div className="text-5xl mb-5">🌐</div>

    <p className="text-slate-400">
      Most Suspicious IP
    </p>

    <h2 className="text-2xl font-bold mt-4 text-blue-400 break-all">
      {data.top_ip}
    </h2>

  </div>

</div>

{/* Threat Distribution */}

<div className="mt-10">

  <ThreatDistribution
    critical={data.critical_incidents}
    high={data.high_incidents}
    medium={data.medium_incidents}
    low={data.low_incidents}
  />

</div>

{/* Recent AI Analysis */}

<div className="mt-12">

  <div className="flex items-center justify-between mb-8">

    <h2 className="text-3xl font-bold">
      📝 Recent AI Analysis
    </h2>

    <span className="text-slate-400">
      Latest AI Results
    </span>

  </div>

  <div className="space-y-6">

    {data.recent_analysis.map((analysis, index) => (

      <div
        key={index}
        className="rounded-2xl bg-[#0b1225] border border-slate-700 p-6 hover:border-blue-500 transition-all duration-300"
      >

        <div className="flex justify-between items-start gap-8">

          <div className="flex-1">

            <h3 className="text-2xl font-bold">
              {analysis.event}
            </h3>

            <p className="text-slate-400 mt-3 leading-7">
              {analysis.summary || "No AI summary available."}
            </p>

          </div>

          <div className="text-center min-w-[120px]">

            <div
              className={`text-4xl font-black ${
                analysis.risk >= 80
                  ? "text-red-400"
                  : analysis.risk >= 50
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            >
              {analysis.risk}
            </div>

            <div className="text-slate-500 mt-2">
              Risk
            </div>

          </div>

        </div>

      </div>

    ))}

  </div>

</div>

<div className="mt-10">
  <AICopilot />
</div>

        </div>
      </div>
    </div>
  );
}
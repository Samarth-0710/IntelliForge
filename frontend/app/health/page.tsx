"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { SystemHealthResponse } from "@/types/health";
import {
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Brain,
  Globe,
  Bot,
  Zap,
  Mail,
  Smartphone,
  Radio,
} from "lucide-react";

export default function HealthPage() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get<SystemHealthResponse>("/health/system");
      setHealth(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const getSubsystemIcon = (key: string) => {
    switch (key) {
      case "api":
        return <Server size={22} className="text-blue-400" />;
      case "database":
        return <Database size={22} className="text-cyan-400" />;
      case "ai":
        return <Brain size={22} className="text-purple-400" />;
      case "threat_intelligence":
        return <Globe size={22} className="text-emerald-400" />;
      case "lyzr_agent":
        return <Bot size={22} className="text-indigo-400" />;
      case "automation":
        return <Zap size={22} className="text-amber-400" />;
      case "email":
        return <Mail size={22} className="text-rose-400" />;
      case "sms":
        return <Smartphone size={22} className="text-orange-400" />;
      case "collectors":
        return <Radio size={22} className="text-green-400" />;
      default:
        return <CheckCircle2 size={22} className="text-blue-400" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <HeartPulse className="text-green-400 animate-pulse" />
                System Health & Subsystem Matrix
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Real-time operational status, external integrations, and database connectivity
              </p>
            </div>

            <button
              onClick={fetchHealth}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition self-start md:self-auto"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh Matrix</span>
            </button>
          </div>

          {/* System Overview Hero */}
          <div className="bg-[#0b1225] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-green-500/20 text-green-400 border border-green-500/30">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    SOC Platform Operational
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold font-mono">
                    HEALTHY
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Platform Version {health?.version || "2.0.0"} &bull; Environment: {health?.environment || "production"}
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-400 font-mono">
              <span>Last Checked: {health ? new Date(health.timestamp).toLocaleTimeString() : "-"}</span>
            </div>
          </div>

          {/* Subsystems Matrix Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {health?.subsystems &&
              Object.entries(health.subsystems).map(([key, sub]) => (
                <div
                  key={key}
                  className="bg-[#0b1225] rounded-2xl p-6 border border-slate-800/80 shadow-xl space-y-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#111827] border border-slate-800">
                        {getSubsystemIcon(key)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm tracking-tight capitalize">
                          {key.replace("_", " ")}
                        </h3>
                        <p className="text-[11px] text-slate-400">{sub.detail}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1.5 ${
                        sub.operational
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          sub.operational ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                        }`}
                      />
                      {sub.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between text-slate-400">
                    <span>Integration Layer</span>
                    <span className="text-slate-300 font-medium">Ready</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

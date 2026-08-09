"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import IncidentTable from "@/components/IncidentTable";
import NotificationBell from "@/components/NotificationBell";
import ThreatChart from "@/components/charts/ThreatChart";
import SeverityChart from "@/components/charts/SeverityChart";
import useDashboard from "@/hooks/useDashboard";

import {
  ShieldAlert,
  Bell,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function Dashboard() {
  const { stats, loading } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050816] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
          <p className="text-slate-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Security Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              Autonomous AI-Powered Security Operations Center
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatsCard
              title="Total Incidents"
              value={stats.total_incidents.toString()}
              icon={<ShieldAlert size={26} />}
              color="red"
            />

            <StatsCard
              title="Active Threats"
              value={stats.open_incidents.toString()}
              icon={<Activity size={26} />}
              color="orange"
            />

            <StatsCard
              title="Resolved"
              value={stats.resolved_incidents.toString()}
              icon={<CheckCircle2 size={26} />}
              color="green"
            />

            <StatsCard
              title="Notifications"
              value={stats.total_notifications.toString()}
              icon={<Bell size={26} />}
              color="blue"
            />
          </div>

          {/* Charts - pass stats to avoid duplicate API calls */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ThreatChart stats={stats} />
            <SeverityChart stats={stats} />
          </div>

          {/* Incident Table */}
          <div>
            <IncidentTable />
          </div>
        </div>
      </div>

      <NotificationBell />
    </div>
  );
}
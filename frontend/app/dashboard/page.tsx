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
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <div className="p-8">
          <h1 className="text-4xl font-bold">
            Security Dashboard
          </h1>

          <p className="text-gray-400 mt-2">
            AI Powered Security Operations Center
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
            <StatsCard
              title="Total Incidents"
              value={stats.total_incidents.toString()}
              icon={<ShieldAlert size={30} />}
              color="red"
            />

            <StatsCard
              title="Active Threats"
              value={stats.open_incidents.toString()}
              icon={<Activity size={30} />}
              color="orange"
            />

            <StatsCard
              title="Resolved"
              value={stats.resolved_incidents.toString()}
              icon={<CheckCircle2 size={30} />}
              color="green"
            />

            <StatsCard
              title="Notifications"
              value={stats.total_notifications.toString()}
              icon={<Bell size={30} />}
              color="blue"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-10">
            <ThreatChart />
            <SeverityChart />
          </div>

          {/* Incident Table */}
          <div className="mt-10">
            <IncidentTable />
          </div>
        </div>
      </div>

      <NotificationBell />
    </div>
  );
}
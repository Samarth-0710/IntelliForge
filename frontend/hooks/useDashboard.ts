"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export interface DashboardStats {
  total_logs: number;
  total_incidents: number;
  critical_incidents: number;
  high_incidents: number;
  medium_incidents?: number;
  low_incidents?: number;
  open_incidents: number;
  resolved_incidents: number;
  total_notifications: number;
  total_endpoints?: number;
  online_endpoints?: number;
  active_threats?: number;
  events_per_minute?: number;
  average_risk?: number;
  top_attack?: string;
  top_source?: string;
  top_user?: string;

  severity_distribution: {
    severity: string;
    count: number;
  }[];

  threat_trend: {
    date: string;
    count: number;
  }[];
}

export default function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_logs: 0,
    total_incidents: 0,
    critical_incidents: 0,
    high_incidents: 0,
    medium_incidents: 0,
    low_incidents: 0,
    open_incidents: 0,
    resolved_incidents: 0,
    total_notifications: 0,
    total_endpoints: 0,
    online_endpoints: 0,
    active_threats: 0,
    events_per_minute: 0,
    average_risk: 0,
    top_attack: "None",
    top_source: "N/A",
    top_user: "N/A",
    severity_distribution: [],
    threat_trend: [],
  });

  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 4000);
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    loading,
    refresh: loadDashboard,
  };
}
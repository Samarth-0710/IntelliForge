"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export interface DashboardStats {
  total_logs: number;
  total_incidents: number;
  critical_incidents: number;
  high_incidents: number;
  open_incidents: number;
  resolved_incidents: number;
  total_notifications: number;

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
    open_incidents: 0,
    resolved_incidents: 0,
    total_notifications: 0,
    severity_distribution: [],
    threat_trend: [],
  });

  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    loading,
  };
}
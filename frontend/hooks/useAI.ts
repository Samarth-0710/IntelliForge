"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export interface AIAnalysis {
  event: string;
  summary: string;
  risk: number;
}

export interface AIDashboard {
  threat_level: string;
  highest_risk: number;
  total_logs: number;
  open_incidents: number;

  critical_incidents: number;
  high_incidents: number;
  medium_incidents: number;
  low_incidents: number;

  top_attack: string;
  top_ip: string;
  top_user: string;

  recommendation: string;

  recent_analysis: AIAnalysis[];
}

export default function useAI() {
  const [data, setData] = useState<AIDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAI() {
    try {
      const res = await api.get("/ai/dashboard");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAI();
  }, []);

  return {
    data,
    loading,
    refresh: loadAI,
  };
}
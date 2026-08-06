"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export interface Log {
  id: number;
  source: string;
  username: string;
  ip_address: string;
  event_type: string;
  severity: string;
  status: string;
  risk_score: number;
  ai_summary: string;
  timestamp: string;
}

export default function useLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    try {
      const res = await api.get("/logs");
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return {
    logs,
    loading,
    refresh: loadLogs,
  };
}
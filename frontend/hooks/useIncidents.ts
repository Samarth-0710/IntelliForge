"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export interface Incident {
  id: number;
  title: string;
  description: string;
  severity: string;
  source_ip: string;
  status: string;
  created_at: string;
}

export default function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadIncidents() {
    try {
      const res = await api.get("/incidents");

      setIncidents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  return {
    incidents,
    loading,
    refresh: loadIncidents,
  };
}
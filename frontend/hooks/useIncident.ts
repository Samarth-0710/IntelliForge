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
  resolved_at?: string;
  assigned_to?: string;
}

export default function useIncident(id: string) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadIncident() {
    if (!id) return;

    try {
      setLoading(true);

      const res = await api.get(`/incidents/${id}`);

      setIncident(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncident();
  }, [id]);

  return {
    incident,
    loading,
    refresh: loadIncident,
  };
}
"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Incident } from "@/types/incident";

export type { Incident };

export default function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get("/incidents");
      setIncidents(res.data);
    } catch (err: any) {
      console.error("Failed to load incidents:", err);
      setError(err.message || "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  return {
    incidents,
    loading,
    error,
    refresh: loadIncidents,
  };
}
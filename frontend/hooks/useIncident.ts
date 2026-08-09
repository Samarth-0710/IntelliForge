"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Incident } from "@/types/incident";

export default function useIncident(id: string | number) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIncident = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/incidents/${id}`);
      setIncident(res.data);
    } catch (err: any) {
      console.error("Failed to load incident:", err);
      if (err.response?.status === 404) {
        setError("Incident not found");
      } else {
        setError("Unable to load incident details");
      }
      setIncident(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadIncident();
  }, [loadIncident]);

  return {
    incident,
    loading,
    error,
    refresh: loadIncident,
  };
}
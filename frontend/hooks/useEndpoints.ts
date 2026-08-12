"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Endpoint, EndpointSummary } from "@/types/endpoint";

export default function useEndpoints() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [summary, setSummary] = useState<EndpointSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEndpoints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<EndpointSummary>("/endpoints/summary");
      setSummary(res.data);
      setEndpoints(res.data.endpoints || []);
    } catch (err: any) {
      console.error("Failed to load endpoints:", err);
      setError("Unable to load endpoints telemetry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
    const interval = setInterval(fetchEndpoints, 5000);
    return () => clearInterval(interval);
  }, [fetchEndpoints]);

  return {
    endpoints,
    summary,
    loading,
    error,
    refresh: fetchEndpoints,
  };
}

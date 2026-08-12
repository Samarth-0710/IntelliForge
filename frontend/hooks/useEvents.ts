"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { LiveEventFeedResponse, LiveEventFeedItem } from "@/types/event";

export default function useEvents() {
  const [data, setData] = useState<LiveEventFeedResponse>({
    total_events: 0,
    events_per_minute: 0,
    high_critical_count: 0,
    events: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveEvents = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get<LiveEventFeedResponse>("/events/live");
      setData(res.data);
    } catch (err: any) {
      console.error("Failed to load live events:", err);
      setError("Unable to stream live security events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveEvents();
    const interval = setInterval(fetchLiveEvents, 3000);
    return () => clearInterval(interval);
  }, [fetchLiveEvents]);

  return {
    events: data.events,
    totalEvents: data.total_events,
    eventsPerMinute: data.events_per_minute,
    highCriticalCount: data.high_critical_count,
    loading,
    error,
    refresh: fetchLiveEvents,
  };
}

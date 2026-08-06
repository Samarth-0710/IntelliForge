"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export interface Notification {
  id: number;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

export default function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  return {
    notifications,
    loading,
    refresh: loadNotifications,
  };
}
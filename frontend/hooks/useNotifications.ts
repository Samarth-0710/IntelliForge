"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Notification } from "@/types/notification";

export type { Notification };

export default function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError(err.response?.data?.detail || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: number): Promise<boolean> => {
    if (markingId === id) return false;
    setMarkingId(id);
    setError(null);

    // Optimistically update frontend state
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );

    try {
      await api.post(`/notifications/${id}/read`);
      return true;
    } catch (err: any) {
      console.error("Failed to mark notification as read:", err);
      // Revert optimistic update on failure
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: false } : item))
      );
      setError(err.response?.data?.detail || "Failed to mark notification as read.");
      return false;
    } finally {
      setMarkingId(null);
    }
  }, [markingId]);

  const deleteNotification = useCallback(async (id: number): Promise<boolean> => {
    if (deletingId === id) return false;
    setDeletingId(id);
    setError(null);

    // Keep backup in case of error
    let backupList: Notification[] = [];
    setNotifications((prev) => {
      backupList = prev;
      return prev.filter((item) => item.id !== id);
    });

    try {
      await api.delete(`/notifications/${id}`);
      return true;
    } catch (err: any) {
      console.error("Failed to delete notification:", err);
      setNotifications(backupList);
      setError(err.response?.data?.detail || "Failed to delete notification.");
      return false;
    } finally {
      setDeletingId(null);
    }
  }, [deletingId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    loading,
    error,
    markingId,
    deletingId,
    refresh: loadNotifications,
    markAsRead,
    deleteNotification,
  };
}
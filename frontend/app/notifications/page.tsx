"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import useNotifications from "@/hooks/useNotifications";
import { Check, Trash2, Bell, AlertTriangle, ShieldAlert, ExternalLink } from "lucide-react";

function severityColor(severity: string) {
  switch ((severity || "").toLowerCase()) {
    case "critical":
      return "bg-red-600";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500 text-black";
    case "low":
      return "bg-green-600";
    default:
      return "bg-slate-600";
  }
}

function severityIcon(severity: string) {
  switch ((severity || "").toLowerCase()) {
    case "critical":
      return "🚨";
    case "high":
      return "🔴";
    case "medium":
      return "🟠";
    case "low":
      return "🟢";
    default:
      return "🔔";
  }
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days === 1) return "Yesterday";

  return `${days} days ago`;
}

function extractIncidentId(message: string, title: string): number | null {
  const combined = `${title} ${message}`;
  const match = combined.match(/incident\s*#?(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

export default function NotificationsPage() {
  const {
    notifications,
    loading,
    error,
    markingId,
    deletingId,
    markAsRead,
    deleteNotification,
  } = useNotifications();

  const unreadCount = notifications.filter(
    (n) => !n.is_read
  ).length;

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-8 max-w-6xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Notifications
              </h1>

              {unreadCount > 0 && (
                <span className="bg-red-600 px-3.5 py-1 rounded-full text-sm font-semibold text-white shadow-md shadow-red-600/20">
                  {unreadCount} Unread
                </span>
              )}
            </div>

            <Link
              href="/incidents"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 transition font-medium"
            >
              <ShieldAlert size={16} />
              View Security Incidents
            </Link>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading SOC notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-[#0b1225] rounded-2xl border border-slate-800 p-16 text-center shadow-xl">
              <div className="text-5xl mb-4">
                🔔
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-white">
                No Notifications
              </h2>
              <p className="text-slate-400 text-sm">
                Your Security Operations Center has no active alerts.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const incidentId = extractIncidentId(notification.message, notification.title);

                return (
                  <div
                    key={notification.id}
                    className={`rounded-2xl p-6 border transition-all duration-200 hover:shadow-xl ${
                      notification.is_read
                        ? "bg-[#0b1225] border-slate-800/90 text-slate-300"
                        : "bg-[#111c38] border-blue-500/50 shadow-lg shadow-blue-900/10"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2.5 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>{severityIcon(notification.severity)}</span>
                            {notification.title}
                          </h2>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${severityColor(
                              notification.severity
                            )}`}
                          >
                            {notification.severity}
                          </span>

                          {!notification.is_read && (
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="text-slate-300 text-base leading-relaxed">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>
                            {timeAgo(notification.created_at)} • {new Date(notification.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>

                          {incidentId && (
                            <Link
                              href={`/incidents/${incidentId}`}
                              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold transition"
                            >
                              <span>Open Incident #{incidentId}</span>
                              <ExternalLink size={12} />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
                        {notification.is_read ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 text-slate-400 text-xs font-semibold border border-slate-700/50 select-none">
                            <Check size={14} className="text-green-400" />
                            Read
                          </span>
                        ) : (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            disabled={markingId === notification.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed disabled:bg-green-800 shadow-md shadow-green-600/20"
                            title="Mark this alert as read"
                          >
                            {markingId === notification.id ? (
                              <>
                                <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Check size={14} />
                                <span>Mark Read</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => deleteNotification(notification.id)}
                          disabled={deletingId === notification.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/40 text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed"
                          title="Delete notification"
                        >
                          {deletingId === notification.id ? (
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-400/30 border-t-slate-400 animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
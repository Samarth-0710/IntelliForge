"use client";

import Link from "next/link";
import useNotifications from "@/hooks/useNotifications";

export default function NotificationBell() {
  const { notifications, loading } = useNotifications();

  return (
    <div className="hidden 2xl:block w-80 bg-[#0B1220] border-l border-slate-800 p-6 shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          Live Alerts
        </h2>
        <Link
          href="/notifications"
          className="text-xs text-blue-400 hover:text-blue-300 transition"
        >
          View All
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span>Loading alerts...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          <p>No recent notifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.slice(0, 8).map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl p-4 border transition duration-200 ${
                notification.is_read
                  ? "bg-[#111827] border-slate-800/80"
                  : "bg-[#141e33] border-blue-500/40 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm text-white leading-snug">
                  {notification.title}
                </h3>
                {!notification.is_read && (
                  <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                )}
              </div>

              <p className="text-slate-400 mt-1.5 text-xs line-clamp-2">
                {notification.message}
              </p>

              <div className="flex items-center justify-between mt-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                    notification.severity === "Critical"
                      ? "bg-red-600"
                      : notification.severity === "High"
                      ? "bg-orange-500"
                      : notification.severity === "Medium"
                      ? "bg-yellow-500 text-black"
                      : "bg-green-600"
                  }`}
                >
                  {notification.severity}
                </span>

                <span className="text-[10px] text-slate-500">
                  {new Date(notification.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
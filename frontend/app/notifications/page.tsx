"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import useNotifications from "@/hooks/useNotifications";
import api from "@/lib/api";

function severityColor(severity: string) {
  switch (severity.toLowerCase()) {
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
  switch (severity.toLowerCase()) {
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

export default function NotificationsPage() {
  const {
    notifications,
    loading,
    refresh,
  } = useNotifications();

  const unreadCount = notifications.filter(
    (n) => !n.is_read
  ).length;

  async function markAsRead(id: number) {
    try {
      await api.post(`/notifications/${id}/read`);
      refresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteNotification(id: number) {
    try {
      await api.delete(`/notifications/${id}`);
      refresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <div className="p-8">

          <div className="flex items-center gap-4 mb-8">

            <h1 className="text-5xl font-bold">
              Notifications
            </h1>

            {unreadCount > 0 && (
              <span className="bg-red-600 px-4 py-2 rounded-full font-semibold">
                {unreadCount} Unread
              </span>
            )}

          </div>

          {loading ? (

            <div className="text-xl">
              Loading...
            </div>

          ) : notifications.length === 0 ? (

            <div className="bg-[#0b1225] rounded-xl p-16 text-center">

              <div className="text-6xl mb-4">
                🔔
              </div>

              <h2 className="text-3xl font-semibold mb-2">
                No New Notifications
              </h2>

              <p className="text-slate-400">
                Your Security Operations Center is quiet.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {notifications.map((notification) => (

                <div
                  key={notification.id}
                  className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg ${
                    notification.is_read
                      ? "bg-[#0b1225] border-slate-800"
                      : "bg-[#111b35] border-blue-500"
                  }`}
                >

                  <div className="flex justify-between items-start">

                    <div className="space-y-3 flex-1">

                      <div className="flex items-center gap-3 flex-wrap">

                        <h2 className="text-xl font-semibold flex items-center gap-2">

                          <span>
                            {severityIcon(notification.severity)}
                          </span>

                          {notification.title}

                        </h2>

                        <span
                          className={`px-3 py-1 rounded-full text-sm text-white ${severityColor(
                            notification.severity
                          )}`}
                        >
                          {notification.severity}
                        </span>

                        {!notification.is_read && (
                          <span className="bg-blue-600 px-2 py-1 rounded-full text-xs">
                            NEW
                          </span>
                        )}

                      </div>

                      <p className="text-slate-300 text-lg">
                        {notification.message}
                      </p>

                      <p className="text-slate-500 text-sm">
                        {timeAgo(notification.created_at)}
                      </p>

                    </div>

                    <div className="flex gap-3 ml-6">

                      {notification.is_read ? (

                        <div className="bg-slate-700 text-green-400 px-4 py-2 rounded-lg font-semibold">
                          ✓ Read
                        </div>

                      ) : (

                        <button
                          onClick={() =>
                            markAsRead(notification.id)
                          }
                          className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg transition"
                        >
                          Mark Read
                        </button>

                      )}

                      <button
                        onClick={() =>
                          deleteNotification(notification.id)
                        }
                        className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg transition"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>
      </div>
    </div>
  );
}
"use client";

import useNotifications from "@/hooks/useNotifications";

export default function NotificationBell() {
  const { notifications, loading } = useNotifications();

  return (
    <div className="w-80 bg-[#111827] border-l border-gray-800 p-6">
      <h2 className="text-3xl font-bold mb-8">
        Notifications
      </h2>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500">
          No notifications
        </p>
      ) : (
        <div className="space-y-5">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-[#1A2335] rounded-xl p-4 border border-gray-700 hover:border-blue-500 transition"
            >
              <h3 className="font-semibold text-lg">
                {notification.title}
              </h3>

              <p className="text-gray-400 mt-2 text-sm">
                {notification.message}
              </p>

              <span
                className={`inline-block mt-3 px-3 py-1 rounded-full text-xs ${
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
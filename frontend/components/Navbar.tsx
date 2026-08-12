"use client";

import Link from "next/link";
import { Bell, Search, UserCircle, Shield, HeartPulse } from "lucide-react";
import useNotifications from "@/hooks/useNotifications";
import useAuth from "@/hooks/useAuth";

export default function Navbar() {
  const { notifications } = useNotifications();
  const { user } = useAuth();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="h-16 bg-[#0B1220] border-b border-slate-800/80 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            IntelliForge SOC Command Center
          </h2>
          <p className="text-slate-400 text-[11px]">
            {date} • Level-3 Autonomous Defense Active
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* System Health Quick Status Link */}
        <Link
          href="/health"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="View Real-Time System Health"
        >
          <span className="h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse" />
          <span className="font-semibold text-[11px]">System Status:</span>
          <span className="text-green-400 font-mono text-[11px] font-bold">100% Operational</span>
        </Link>

        <Link
          href="/notifications"
          className="relative p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer text-slate-300 hover:text-white"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <UserCircle size={32} className="text-blue-400" />
          <div className="text-left">
            <h3 className="font-semibold text-xs text-white">
              {user?.username || "SOC Analyst"}
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {user?.role || "ADMIN"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
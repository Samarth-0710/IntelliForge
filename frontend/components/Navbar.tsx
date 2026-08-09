"use client";

import Link from "next/link";
import { Bell, Search, UserCircle } from "lucide-react";
import useNotifications from "@/hooks/useNotifications";
import useAuth from "@/hooks/useAuth";

export default function Navbar() {
  const { notifications } = useNotifications();
  const { user } = useAuth();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="h-20 bg-[#0B1220] border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          IntelliForge SOC
        </h2>
        <p className="text-slate-400 text-xs mt-0.5">
          {date}
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center bg-slate-800/80 rounded-xl px-4 py-2 w-80 border border-slate-700/60">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search SOC records..."
            className="bg-transparent outline-none ml-3 w-full text-sm text-white placeholder:text-slate-500"
          />
        </div>

        <Link
          href="/notifications"
          className="relative p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer text-slate-300 hover:text-white"
          title="Notifications"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <UserCircle size={36} className="text-blue-400" />
          <div className="text-left">
            <h3 className="font-semibold text-sm text-white">
              {user?.username || "SOC Analyst"}
            </h3>
            <p className="text-[11px] text-slate-400 capitalize">
              {user?.role || "Administrator"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
"use client";

import { Bell, Search, UserCircle } from "lucide-react";

export default function Navbar() {
  const date = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="h-20 bg-[#0B1220] border-b border-slate-800 flex items-center justify-between px-8">

      <div>
        <h2 className="text-2xl font-bold text-white">
          IntelliForge SOC
        </h2>

        <p className="text-slate-400 text-sm">
          {date}
        </p>
      </div>

      <div className="flex items-center gap-6">

        <div className="flex items-center bg-slate-800 rounded-xl px-4 py-2 w-80">
          <Search size={18} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search incidents..."
            className="bg-transparent outline-none ml-3 w-full text-white placeholder:text-slate-500"
          />
        </div>

        <button className="relative">
          <Bell size={24} className="text-white" />

          <span className="absolute -top-2 -right-2 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
            0
          </span>
        </button>

        <div className="flex items-center gap-3">
          <UserCircle size={40} className="text-blue-400" />

          <div>
            <h3 className="font-semibold">Samarth</h3>
            <p className="text-xs text-slate-400">
              Administrator
            </p>
          </div>
        </div>

      </div>

    </header>
  );
}
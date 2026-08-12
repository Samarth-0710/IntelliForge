"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Activity,
  Monitor,
  Globe,
  BrainCircuit,
  Zap,
  History,
  HeartPulse,
  FileText,
  Bell,
  LogOut,
  Shield,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Incidents",
    href: "/incidents",
    icon: ShieldAlert,
  },
  {
    name: "Live Event Feed",
    href: "/events",
    icon: Activity,
  },
  {
    name: "Endpoints",
    href: "/endpoints",
    icon: Monitor,
  },
  {
    name: "Threat Intel",
    href: "/threat-intel",
    icon: Globe,
  },
  {
    name: "AI SOC Analyst",
    href: "/ai",
    icon: BrainCircuit,
  },
  {
    name: "Automation & SOAR",
    href: "/automation",
    icon: Zap,
  },
  {
    name: "Audit Trail",
    href: "/audit",
    icon: History,
  },
  {
    name: "System Health",
    href: "/health",
    icon: HeartPulse,
  },
  {
    name: "System Logs",
    href: "/logs",
    icon: FileText,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-[#0B1220] border-r border-slate-800/80 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
            IntelliForge <span className="text-xs px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/40">2.0</span>
          </h1>
          <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
            Autonomous SOC Platform
          </p>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-150 text-xs font-medium ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Icon size={17} className={active ? "text-white" : "text-slate-400"} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800/80">
        <div className="px-3 py-2 mb-2 rounded-xl bg-[#111c36] border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse inline-block" />
            Active Defense
          </span>
          <span className="font-mono text-slate-300 font-bold">ONLINE</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer text-xs font-medium border border-transparent hover:border-red-500/20"
        >
          <LogOut size={16} />
          Logout Session
        </button>
      </div>
    </aside>
  );
}
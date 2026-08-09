"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  FileText,
  Bell,
  BrainCircuit,
  LogOut,
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
    name: "Logs",
    href: "/logs",
    icon: FileText,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    name: "AI Analysis",
    href: "/ai",
    icon: BrainCircuit,
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
    <aside className="w-72 bg-[#0B1220] border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-8 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-blue-400 tracking-tight">
          IntelliForge
        </h1>
        <p className="text-slate-400 mt-1 text-xs uppercase tracking-wider">
          Security Operations Center
        </p>
      </div>

      <nav className="flex-1 p-5">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-5 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer text-sm font-medium border border-transparent hover:border-red-500/20"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
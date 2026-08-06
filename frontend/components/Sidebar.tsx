"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  FileText,
  Bell,
  BrainCircuit,
  Settings,
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
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-[#0B1220] border-r border-slate-800 flex flex-col">

      <div className="p-8 border-b border-slate-800">

        <h1 className="text-3xl font-bold text-blue-400">
          IntelliForge
        </h1>

        <p className="text-slate-400 mt-2 text-sm">
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
                className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-300
                ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={22} />

                <span className="font-medium">
                  {item.name}
                </span>

              </Link>
            );

          })}

        </div>

      </nav>

      <div className="p-5 border-t border-slate-800">

        <button
          className="w-full flex items-center gap-4 rounded-xl px-4 py-3 text-red-400 hover:bg-red-500 hover:text-white transition-all"
        >
          <LogOut size={22} />

          Logout

        </button>

      </div>

    </aside>
  );
}
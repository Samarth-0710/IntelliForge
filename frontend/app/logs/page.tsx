"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import LogsTable from "@/components/LogsTable";

export default function LogsPage() {
  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <div className="p-8">
          <h1 className="text-4xl font-bold mb-8">
            System Logs
          </h1>

          <LogsTable />
        </div>
      </div>
    </div>
  );
}
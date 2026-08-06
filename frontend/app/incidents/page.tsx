"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import IncidentTable from "@/components/IncidentTable";

export default function IncidentsPage() {
  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <div className="p-8">
          <h1 className="text-4xl font-bold mb-8">
            Security Incidents
          </h1>

          <IncidentTable />
        </div>
      </div>
    </div>
  );
}
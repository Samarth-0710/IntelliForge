"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

import useIncident from "@/hooks/useIncident";
import api from "@/lib/api";

export default function IncidentDetails() {
  const params = useParams();

  const {
    incident,
    loading,
    refresh,
  } = useIncident(params.id as string);

  const [assignedTo, setAssignedTo] = useState("");

  const resolveIncident = async () => {
    try {
      await api.patch(`/incidents/${incident?.id}/resolve`);

      alert("Incident resolved successfully!");

      refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to resolve incident.");
    }
  };

  const assignIncident = async () => {
    if (!assignedTo) {
      alert("Please select an analyst.");
      return;
    }

    try {
      await api.patch(`/incidents/${incident?.id}/assign`, {
        assigned_to: assignedTo,
      });

      alert("Incident assigned successfully!");

      refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to assign incident.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050816] text-white">
        Loading...
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050816] text-white">
        Incident not found
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <div className="p-8">

          <h1 className="text-4xl font-bold mb-8">
            {incident.title}
          </h1>

          <div className="bg-[#0b1225] rounded-xl p-6 space-y-5">

            <p>
              <strong>Description:</strong>{" "}
              {incident.description}
            </p>

            <p>
              <strong>Severity:</strong>{" "}
              {incident.severity}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {incident.status}
            </p>

            <p>
              <strong>Source IP:</strong>{" "}
              {incident.source_ip}
            </p>

            <p>
              <strong>Assigned To:</strong>{" "}
              {incident.assigned_to ?? "Unassigned"}
            </p>

            <p>
              <strong>Created At:</strong>{" "}
              {new Date(incident.created_at).toLocaleString()}
            </p>

            {incident.resolved_at && (
              <p>
                <strong>Resolved At:</strong>{" "}
                {new Date(incident.resolved_at).toLocaleString()}
              </p>
            )}

            {/* Assign Analyst */}

            <div className="pt-6">

              <label className="block mb-2 font-semibold">
                Assign Analyst
              </label>

              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-72 bg-[#10192f] border border-gray-700 rounded-lg px-4 py-3"
              >
                <option value="">Select Analyst</option>

                <option value="Samarth">
                  Samarth
                </option>

                <option value="Harshitha">
                  Harshitha
                </option>

                <option value="Mohith">
                  Mohith
                </option>

                <option value="Hindushree">
                  Hindushree
                </option>

                <option value="Kumuda">
                  Kumuda
                </option>

              </select>

            </div>

            {/* Action Buttons */}

            <div className="flex gap-4 pt-6">

              <button
                onClick={resolveIncident}
                disabled={incident.status === "Resolved"}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  incident.status === "Resolved"
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {incident.status === "Resolved"
                  ? "Resolved"
                  : "Resolve Incident"}
              </button>

              <button
                onClick={assignIncident}
                className="px-6 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition"
              >
                Assign Incident
              </button>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
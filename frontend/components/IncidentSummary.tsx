"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function IncidentSummary({
  incidentId,
}: {
  incidentId: number;
}) {

  const [summary, setSummary] = useState("Loading...");

  useEffect(() => {

    async function load() {

      try {

        const res = await api.get(
          `/ai/summary/${incidentId}`
        );

        setSummary(res.data.summary);

      } catch {

        setSummary("Unavailable");

      }

    }

    load();

  }, [incidentId]);

  return (
  <div className="max-w-[220px] text-sm text-slate-300 leading-6">
    {summary}
  </div>
);
}
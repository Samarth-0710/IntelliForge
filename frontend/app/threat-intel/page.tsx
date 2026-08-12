"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { ThreatIntelligenceRecord } from "@/types/threat_intel";
import {
  Globe,
  Search,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Flame,
  AlertTriangle,
  Radio,
} from "lucide-react";

export default function ThreatIntelPage() {
  const [indicator, setIndicator] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<ThreatIntelligenceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indicator.trim()) return;

    try {
      setSearching(true);
      setError(null);
      setResult(null);

      const res = await api.post<ThreatIntelligenceRecord>("/threat-intel/lookup", {
        indicator: indicator.trim(),
      });
      setResult(res.data);
    } catch (err: any) {
      setError("Threat intelligence lookup failed. Check backend connectivity.");
    } finally {
      setSearching(false);
    }
  };

  const handleQuickLookup = (sample: string) => {
    setIndicator(sample);
  };

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-8 space-y-6 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Globe className="text-blue-400" />
              Tavily Threat Intelligence Engine
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Real-time IOC reputation scanner, threat actor profiling, and autonomous web intelligence
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-[#0b1225] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter IP address (e.g. 185.220.101.5), Domain, or Hash..."
                  value={indicator}
                  onChange={(e) => setIndicator(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={searching || !indicator.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20 cursor-pointer disabled:bg-slate-700"
              >
                {searching ? "Searching..." : "Scan Indicator"}
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-400">
              <span className="font-semibold">Quick Samples:</span>
              <button
                onClick={() => handleQuickLookup("185.220.101.5")}
                className="px-2.5 py-1 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-[11px]"
              >
                185.220.101.5 (Known Malicious IP)
              </button>
              <button
                onClick={() => handleQuickLookup("100.85.20.12")}
                className="px-2.5 py-1 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-800 text-purple-300 font-mono text-[11px]"
              >
                100.85.20.12 (Tailscale Internal)
              </button>
              <button
                onClick={() => handleQuickLookup("192.168.1.150")}
                className="px-2.5 py-1 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-800 text-green-300 font-mono text-[11px]"
              >
                192.168.1.150 (Private LAN)
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Results Card */}
          {result && (
            <div className="bg-[#0b1225] rounded-2xl p-6 md:p-8 border border-slate-800 shadow-2xl space-y-6 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                    Queried Indicator ({result.indicator_type})
                  </span>
                  <h2 className="text-2xl font-bold font-mono text-white">
                    {result.indicator}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-xl font-bold uppercase text-xs border ${
                    result.verdict === "Known Malicious"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : result.verdict === "Suspicious"
                      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      : "bg-green-500/20 text-green-400 border-green-500/30"
                  }`}>
                    Verdict: {result.verdict}
                  </span>

                  <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30">
                    Confidence: {result.confidence}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Intelligence Summary
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-[#111827] p-5 rounded-xl border border-slate-800">
                  {result.summary}
                </p>
              </div>

              {result.sources && result.sources.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Threat Sources & References ({result.sources.length})
                  </h4>
                  <div className="space-y-1.5">
                    {result.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 hover:underline p-2 rounded-lg bg-[#111827] border border-slate-800/80"
                      >
                        <ExternalLink size={13} />
                        <span className="truncate">{src}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

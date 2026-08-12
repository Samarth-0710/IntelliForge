export interface ThreatIntelligenceRecord {
  id?: number;
  indicator: string;
  indicator_type: string;
  verdict: "Known Malicious" | "Suspicious" | "Unknown" | "No Evidence" | string;
  confidence: number;
  summary: string;
  sources: string[];
  last_checked: string;
  query?: string;
  incident_id?: number | null;
}

export interface SecurityEvent {
  id: number;
  timestamp: string;
  endpoint_id?: string | null;
  hostname?: string | null;
  source: string;
  event_type: string;
  event_id?: number | null;
  username?: string | null;
  source_ip?: string | null;
  destination_ip?: string | null;
  workstation?: string | null;
  category?: string | null;
  severity: "Low" | "Medium" | "High" | "Critical" | string;
  risk_score: number;
  status: string;
  raw_metadata?: string | null;
  normalized_metadata?: string | null;
  is_simulation: boolean;
  incident_id?: number | null;
}

export interface LiveEventFeedItem {
  id: number;
  timestamp: string;
  severity: string;
  event_id?: number | null;
  event_type: string;
  hostname?: string | null;
  endpoint_id?: string | null;
  username?: string | null;
  source_ip?: string | null;
  risk_score: number;
  is_simulation: boolean;
  description: string;
}

export interface LiveEventFeedResponse {
  total_events: number;
  events_per_minute: number;
  high_critical_count: number;
  events: LiveEventFeedItem[];
}

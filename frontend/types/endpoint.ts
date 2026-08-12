export interface Endpoint {
  id: number;
  endpoint_id: string;
  hostname: string;
  operating_system: string;
  platform: string;
  ip_address?: string | null;
  tailscale_ip?: string | null;
  status: "Online" | "Offline" | "Degraded" | string;
  last_seen: string;
  collector_version: string;
  risk_level: "Low" | "Medium" | "High" | "Critical" | string;
  event_count: number;
  incident_count: number;
  registered_at: string;
}

export interface EndpointSummary {
  total_endpoints: number;
  online_endpoints: number;
  offline_endpoints: number;
  high_risk_endpoints: number;
  endpoints: Endpoint[];
}

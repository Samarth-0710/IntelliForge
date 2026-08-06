export interface Incident {
  id: number;
  title: string;
  description: string;
  severity: string;
  source_ip: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
}
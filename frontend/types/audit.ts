export interface AuditLogItem {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  result: "SUCCESS" | "FAILURE" | "WARNING" | string;
  details?: string | null;
}

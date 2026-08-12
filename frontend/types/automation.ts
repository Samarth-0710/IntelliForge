export interface AutomationRun {
  id: number;
  incident_id: number;
  workflow_name: string;
  trigger_type: string;
  status: string;
  triggered_at: string;
  completed_at?: string | null;
}

export interface SOARAction {
  id: number;
  incident_id: number;
  action_type: string;
  target?: string | null;
  is_destructive: boolean;
  status: "Proposed" | "Approved" | "Rejected" | "Executed" | "Failed" | string;
  proposed_by: string;
  approved_by?: string | null;
  reason?: string | null;
  execution_result?: string | null;
  created_at: string;
  executed_at?: string | null;
}

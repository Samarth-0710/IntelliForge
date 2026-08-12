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
  risk_score?: number;
  confidence?: number;
  endpoint_id?: string | null;
  correlation_id?: string | null;
}

export interface IncidentTimelineItem {
  id: number;
  incident_id: number;
  stage: string;
  title: string;
  description: string;
  actor: string;
  status: string;
  timestamp: string;
}

export interface AttackTechniqueItem {
  id: number;
  incident_id: number;
  tactic: string;
  technique_id: string;
  technique_name: string;
  confidence: number;
  evidence: string;
  detected_at: string;
}

export interface SOCAnalystReport {
  incident_id: number;
  title: string;
  severity: string;
  risk_score: number;
  confidence: number;
  assessment: string;
  evidence: string[];
  mitre_attack: {
    tactic: string;
    technique_id: string;
    technique_name: string;
    confidence: number;
    evidence: string;
  }[];
  threat_intelligence: {
    indicator: string;
    verdict: string;
    confidence: number;
    summary: string;
    sources: string[];
  };
  recommended_actions: string[];
  timestamp: string;
}
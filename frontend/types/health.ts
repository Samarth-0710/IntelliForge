export interface SubsystemHealth {
  status: string;
  operational: boolean;
  detail: string;
}

export interface SystemHealthResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  subsystems: {
    api: SubsystemHealth;
    database: SubsystemHealth;
    ai: SubsystemHealth;
    threat_intelligence: SubsystemHealth;
    lyzr_agent: SubsystemHealth;
    automation: SubsystemHealth;
    email: SubsystemHealth;
    sms: SubsystemHealth;
    collectors: SubsystemHealth;
    [key: string]: SubsystemHealth;
  };
}

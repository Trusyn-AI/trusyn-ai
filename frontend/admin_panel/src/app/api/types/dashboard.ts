import type { Severity } from "./common";

export type DashboardSummaryDto = {
  kpis: {
    active_agents: number;
    blocked_threats_24h: number;
    avg_risk_score_24h: number;
    policies_enabled: number;
  };
  recent_threats: Array<{
    id: string;
    threat_type: string;
    severity: Severity;
    title: string;
    description?: string | null;
    agent_id?: string | null;
    detected_at: string;
  }>;
  recent_decisions: Array<{
    id: string;
    threat_event_id: string;
    decision: "ALLOW" | "BLOCK" | "REVIEW" | "QUARANTINE" | "RATE_LIMIT";
    risk_score: number;
    confidence_score: number;
    reason?: string | null;
    created_at: string;
  }>;
  agent_activity_snapshot: Array<{
    agent_id: string;
    agent_name: string;
    events_count_24h: number;
    trust_score: number;
  }>;
  threat_count_by_day: Array<{
    bucket: string;
    count: number;
  }>;
  decision_distribution: Array<{
    decision: "ALLOW" | "BLOCK" | "REVIEW" | "QUARANTINE" | "RATE_LIMIT";
    count: number;
  }>;
};


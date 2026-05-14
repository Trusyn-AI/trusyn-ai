import type { Decision, Severity } from './common';

export type ThreatInvestigationDto = {
  threat_id: string;
  organization_id: string;
  agent_id?: string | null;
  threat_type: string;
  severity: Severity;
  title: string;
  description?: string | null;
  detected_at: string;
  source_ip?: string | null;
  raw_payload: Record<string, unknown>;
  decisions: Array<{
    governance_decision_id: string;
    decision: Decision;
    risk_score: number;
    confidence_score: number;
    reason?: string | null;
    created_at: string;
  }>;
  matched_policies: Array<{
    policy_id: string;
    name: string;
    enforcement_action: Decision;
  }>;
  risk_reasoning_summary: string;
  timeline: Array<{
    event_type: string;
    timestamp: string;
    severity: Severity;
    message: string;
  }>;
  related_threats: Array<{
    threat_id: string;
    threat_type: string;
    severity: Severity;
    title: string;
    detected_at: string;
  }>;
  explainability_summary?: string | null;
};

export type IntegrationDto = {
  key: string;
  enabled: boolean;
  config: Record<string, unknown>;
};

export type ApiKeyItemDto = {
  id: string;
  organization_id: string;
  name: string;
  permissions: Record<string, unknown>;
  last_used_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiKeyCreateResponseDto = {
  id: string;
  name: string;
  key: string;
  permissions: Record<string, unknown>;
  expires_at?: string | null;
  created_at: string;
};

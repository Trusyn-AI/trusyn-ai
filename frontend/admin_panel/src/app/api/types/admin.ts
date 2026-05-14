import type { OrganizationDto, UserDto } from "./auth";
import type { PaginatedResult, Severity } from "./common";

export type AgentDto = {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  status: "OPERATIONAL" | "WARNING" | "QUARANTINED" | "BLOCKED";
  trust_score: number;
  permissions: Record<string, unknown>;
  metadata: Record<string, unknown>;
  last_active_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type PolicyDto = {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  rule_definition: Record<string, unknown>;
  enforcement_action: "ALLOW" | "BLOCK" | "REVIEW" | "QUARANTINE" | "RATE_LIMIT";
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type ThreatDto = {
  id: string;
  organization_id: string;
  agent_id?: string | null;
  threat_type: string;
  severity: Severity;
  title: string;
  description?: string | null;
  raw_payload: Record<string, unknown>;
  source_ip?: string | null;
  detected_at: string;
  created_at: string;
  updated_at: string;
};

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
    decision: "ALLOW" | "BLOCK" | "REVIEW" | "QUARANTINE" | "RATE_LIMIT";
    risk_score: number;
    confidence_score: number;
    reason?: string | null;
    created_at: string;
  }>;
  matched_policies: Array<{
    policy_id: string;
    name: string;
    enforcement_action: "ALLOW" | "BLOCK" | "REVIEW" | "QUARANTINE" | "RATE_LIMIT";
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

export type AuditLogDto = {
  id: string;
  organization_id: string;
  user_id?: string | null;
  event_type: string;
  severity: Severity;
  message: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  created_at: string;
  updated_at: string;
};

export type IntegrationDto = {
  key: string;
  enabled: boolean;
  config: Record<string, unknown>;
};

export type ApiKeyListItem = {
  id: string;
  organization_id: string;
  name: string;
  permissions: Record<string, unknown>;
  last_used_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiKeyCreateResponse = {
  id: string;
  name: string;
  key: string;
  permissions: Record<string, unknown>;
  expires_at?: string | null;
  created_at: string;
};

export type AdminOrganizationItem = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "DISABLED";
  website?: string | null;
  created_at: string;
  users_count: number;
  active_agents_count: number;
  policies_enabled_count: number;
  threats_24h_count: number;
  avg_risk_24h: number;
};

export type AdminPlatformOverview = {
  kpis: {
    total_organizations: number;
    active_agents: number;
    threats_blocked_24h: number;
    requests_processed_24h: number;
    avg_risk_score_24h: number;
  };
  recent_threats: Array<{
    id: string;
    organization_id: string;
    organization_name: string;
    threat_type: string;
    severity: Severity;
    title: string;
    detected_at: string;
  }>;
  decision_distribution: Array<{
    decision: "ALLOW" | "BLOCK" | "REVIEW" | "QUARANTINE" | "RATE_LIMIT";
    count: number;
  }>;
  risk_leaderboard: Array<{
    organization_id: string;
    organization_name: string;
    avg_risk_score: number;
    threats_count_24h: number;
  }>;
};

export type AdminApiMonitoringSummary = {
  requests_per_second: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  success_count: number;
  blocked_count: number;
  failed_count: number;
  model_usage: Record<string, number>;
  requests_by_hour: Array<{ bucket: string; count: number }>;
};

export type AdminApiRequestItem = {
  id: string;
  timestamp: string;
  organization_id: string;
  organization_name: string;
  agent_id?: string | null;
  agent_name?: string | null;
  endpoint: string;
  status: "success" | "blocked" | "failed";
  latency_ms: number;
  model: string;
  risk_score?: number | null;
};

export type APIHealthResponse = {
  status: string;
  service: string;
  version?: string;
  environment?: string;
  timestamp?: string;
};

export type DbHealthResponse = {
  status: string;
  database: string;
  connected: boolean;
  latency_ms?: number | null;
  timestamp: string;
};

export type ComponentHealthResponse = {
  status: string;
  component: string;
  connected: boolean;
  latency_ms?: number | null;
  timestamp: string;
  details: Record<string, unknown>;
};

export type MetricsResponse = Record<string, unknown>;

export type AdminOrganizationsResponse = PaginatedResult<AdminOrganizationItem>;

export type ProfileBundle = {
  user: UserDto;
  organization: OrganizationDto;
};

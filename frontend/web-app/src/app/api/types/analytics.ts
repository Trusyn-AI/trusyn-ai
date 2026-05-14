import type { Decision, Severity } from './common';

export type AnalyticsOverviewDto = {
  total_threats: number;
  total_decisions: number;
  blocked_decisions: number;
  average_risk_score: number;
  active_agents: number;
  policy_count_enabled: number;
};

export type AnalyticsRiskTrendsDto = {
  items: Array<{ bucket: string; severity: Severity; count: number }>;
};

export type AnalyticsDecisionDistributionDto = {
  items: Array<{ decision: Decision; count: number }>;
};

export type AnalyticsAgentTrustTrendsDto = {
  items: Array<{
    agent_id: string;
    agent_name: string;
    trust_score: number;
    status: string;
  }>;
};

export type AnalyticsPolicyImpactDto = {
  items: Array<{
    policy_id: string;
    policy_name: string;
    enforcement_action: Decision;
    related_events: number;
  }>;
};

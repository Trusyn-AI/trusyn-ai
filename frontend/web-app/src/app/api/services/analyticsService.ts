import { apiRequest } from "../client";
import { endpoints } from "../endpoints";
import type {
  AnalyticsAgentTrustTrendsDto,
  AnalyticsDecisionDistributionDto,
  AnalyticsOverviewDto,
  AnalyticsPolicyImpactDto,
  AnalyticsRiskTrendsDto,
} from "../types/analytics";

export type AnalyticsQueryParams = {
  start_at?: string;
  end_at?: string;
  granularity?: "hour" | "day" | "week";
  agent_id?: string;
  policy_id?: string;
};

export const analyticsService = {
  overview(params?: AnalyticsQueryParams): Promise<AnalyticsOverviewDto> {
    return apiRequest<AnalyticsOverviewDto>(endpoints.analytics.overview, {
      method: "GET",
      query: params,
    });
  },

  riskTrends(params?: AnalyticsQueryParams): Promise<AnalyticsRiskTrendsDto> {
    return apiRequest<AnalyticsRiskTrendsDto>(endpoints.analytics.riskTrends, {
      method: "GET",
      query: params,
    });
  },

  decisionDistribution(params?: AnalyticsQueryParams): Promise<AnalyticsDecisionDistributionDto> {
    return apiRequest<AnalyticsDecisionDistributionDto>(endpoints.analytics.decisionDistribution, {
      method: "GET",
      query: params,
    });
  },

  agentTrustTrends(params?: AnalyticsQueryParams): Promise<AnalyticsAgentTrustTrendsDto> {
    return apiRequest<AnalyticsAgentTrustTrendsDto>(endpoints.analytics.trustTrends, {
      method: "GET",
      query: params,
    });
  },

  policyImpact(params?: AnalyticsQueryParams): Promise<AnalyticsPolicyImpactDto> {
    return apiRequest<AnalyticsPolicyImpactDto>(endpoints.analytics.policyImpact, {
      method: "GET",
      query: params,
    });
  },
};


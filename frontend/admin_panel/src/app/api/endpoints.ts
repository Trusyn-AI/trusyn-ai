export const endpoints = {
  auth: {
    login: "/api/v1/auth/login",
    refresh: "/api/v1/auth/refresh",
    me: "/api/v1/auth/me",
  },
  admin: {
    organizations: "/api/v1/admin/organizations",
    platformOverview: "/api/v1/admin/platform-overview",
    apiMonitoringSummary: "/api/v1/admin/api-monitoring/summary",
    apiMonitoringRequests: "/api/v1/admin/api-monitoring/requests",
  },
  agents: {
    base: "/api/v1/agents",
    byId: (id: string) => `/api/v1/agents/${id}`,
  },
  policies: {
    base: "/api/v1/policies",
    byId: (id: string) => `/api/v1/policies/${id}`,
  },
  threats: {
    base: "/api/v1/threats",
    byId: (id: string) => `/api/v1/threats/${id}`,
    investigation: (id: string) => `/api/v1/threats/${id}/investigation`,
  },
  auditLogs: {
    base: "/api/v1/audit-logs",
    byId: (id: string) => `/api/v1/audit-logs/${id}`,
  },
  exports: {
    audit: "/api/v1/exports/audit",
    governanceDecisions: "/api/v1/exports/governance-decisions",
  },
  integrations: {
    base: "/api/v1/integrations",
    byKey: (key: string) => `/api/v1/integrations/${encodeURIComponent(key)}`,
  },
  apiKeys: {
    base: "/api/v1/api-keys",
    byId: (id: string) => `/api/v1/api-keys/${id}`,
  },
  users: {
    me: "/api/v1/users/me",
  },
  organizations: {
    current: "/api/v1/organizations/current",
  },
  health: {
    api: "/api/v1/health",
    db: "/api/v1/health/db",
    cache: "/api/v1/health/cache",
    ws: "/api/v1/health/ws",
    governance: "/api/v1/health/governance",
  },
  system: {
    metrics: "/api/v1/system/metrics",
  },
  dashboard: {
    summary: "/api/v1/dashboard/summary",
  },
  analytics: {
    overview: "/api/v1/analytics/overview",
    riskTrends: "/api/v1/analytics/risk-trends",
    decisionDistribution: "/api/v1/analytics/decision-distribution",
    trustTrends: "/api/v1/analytics/agent-trust-trends",
    policyImpact: "/api/v1/analytics/policy-impact",
  },
} as const;

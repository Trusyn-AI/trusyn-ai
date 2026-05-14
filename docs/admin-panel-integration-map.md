# Admin Panel Integration Map

## Scope
This file maps every Super Admin UI surface in `frontend/admin_panel` from mock/demo data to production backend contracts.

## Mapping Table
| Page / Component | Current Mock Source | Target Endpoint(s) | Adapter Requirements | Backend Gap Status |
|---|---|---|---|---|
| `AdminLoginPage` | hardcoded demo credentials | `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/refresh` | map `TokenResponse.user` -> session user | ready |
| `TopNavbar` notifications | inline demo array | `GET /api/v1/admin/platform-overview` (recent threats) | threat item -> compact notification item | ready |
| `PlatformOverview` | `mockData.organizations/aiAgents/threats` + random counters | `GET /api/v1/admin/platform-overview`, `GET /api/v1/dashboard/summary`, `GET /api/v1/agents` | combine KPI + threat feed + decision distribution + agent table | ready |
| `Organizations` | `mockData.organizations` | `GET /api/v1/admin/organizations` | status/plan casing normalization + pagination | ready |
| `ThreatIntelligence` | `mockData.threats` + random stream | `GET /api/v1/threats`, `GET /api/v1/threats/{id}/investigation` | severity enum normalization + investigation drawer mapping | ready |
| `AIAgents` | `mockData.aiAgents` | `GET /api/v1/agents`, `PATCH /api/v1/agents/{id}`, `DELETE /api/v1/agents/{id}` | status enum normalization, trust score visuals | ready |
| `APIMonitoring` | `mockData.apiRequests` + random synthetic feed | `GET /api/v1/admin/api-monitoring/summary`, `GET /api/v1/admin/api-monitoring/requests` | model/status mapping for chart + stream table | ready |
| `Governance` | `mockData.policies` + random req/s text | `GET /api/v1/policies`, `POST /api/v1/policies`, `PATCH /api/v1/policies/{id}`, `DELETE /api/v1/policies/{id}` | `enabled` + `enforcement_action` controls | ready |
| `AuditLogs` | `mockData.auditLogs` | `GET /api/v1/audit-logs`, `GET /api/v1/audit-logs/{id}`, `GET /api/v1/exports/audit?format=csv` | filters/pagination adapter + CSV download | ready |
| `SystemHealth` | `mockData.systemComponents` | `GET /api/v1/health`, `GET /api/v1/health/db`, `GET /api/v1/health/cache`, `GET /api/v1/health/ws`, `GET /api/v1/health/governance`, `GET /api/v1/system/metrics` | component cards + telemetry chart fallback handling | ready |
| `Settings` | demo-only controls + disabled modal | `GET/PATCH /api/v1/users/me`, `GET/PATCH /api/v1/organizations/current`, `GET/PATCH /api/v1/integrations/{key}`, `GET/POST/DELETE /api/v1/api-keys` | sectioned forms + one-time API key reveal | ready |

## Integration Checklist
- Auth/session transport: **in progress**
- Shared API client + typed service layer: **in progress**
- Platform/organization global Super Admin APIs: **done**
- All page mock replacements: **in progress**
- Mock artifact cleanup: **pending final pass**

# User App Integration Map

## Scope
Frontend: `frontend/web-app`
Backend base: `/api/v1`

| Page | Previous Mock Source | Target Endpoint(s) | DTO/Adapter Notes | Status |
|---|---|---|---|---|
| Login | inline demo profiles + `sessionUser` localStorage | `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh` | Token envelope -> session model (`id`, `organizationId`, `role`, `initials`) | Ready |
| Dashboard | `data/mockData.ts` + random generators | `GET /dashboard/summary` | `threat_count_by_day` -> bar chart, `decision_distribution` -> chart, `recent_threats` feed | Ready |
| Agents | `data/mockData.ts` | `GET /agents`, `PATCH /agents/{id}`, `DELETE /agents/{id}` | Backend list is paginated; no timeline payload yet, so detail panel shows entity fields only | Needs adapter |
| Threat Center | `data/threatData.ts` | `GET /threats`, `GET /threats/{id}/investigation` | Investigation schema maps directly; UI converts timeline/decisions/policies arrays | Ready |
| Policies | `data/policyData.ts` | `GET /policies`, `POST /policies`, `PATCH /policies/{id}`, `DELETE /policies/{id}` | `rule_definition` JSON editor; `enabled` maps to toggle | Ready |
| Audit Logs | `data/auditData.ts` | `GET /audit-logs`, `GET /audit-logs/{id}` | filter/search/pagination supported by query params | Ready |
| Analytics | `data/analyticsData.ts` | `GET /analytics/overview`, `/risk-trends`, `/decision-distribution`, `/agent-trust-trends`, `/policy-impact` | common date/granularity query -> chart adapters | Ready |
| Settings | demo modal and local-only actions | `GET/PATCH /users/me`, `GET/PATCH /organizations/current`, `GET/PATCH /integrations/{key}`, `GET/POST/DELETE /api-keys` | one-time API key reveal preserved; profile update syncs session user | Ready |

## Missing/Partial Contract Notes
- Agents page previously visualized simulated per-agent activity timeline and risk breakdown. Current backend does not expose per-agent timeline endpoint in `web-app` scope; page now uses real entity data + trust/status controls.
- Threat list endpoint currently supports severity + pagination only; free-text search remains client-side if needed in future.

## Integration Checklist
- Auth/session/token lifecycle: **Ready**
- Protected routing and logout: **Ready**
- Dashboard real data: **Ready**
- CRUD workflows (agents/policies/settings/api keys): **Ready**
- Investigation/audit/analytics: **Ready**
- Remaining blockers: **None for core replacement of mocks**

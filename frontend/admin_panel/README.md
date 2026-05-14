# Trusyn AI Admin Panel

Super Admin console for platform-wide organization oversight, threat intelligence, governance operations, and infrastructure health.

## Prerequisites

- Node.js 20+
- Backend API running (`backend/` FastAPI service)

## Environment

Copy and configure:

```bash
cp .env.example .env
```

Required values:

- `VITE_API_BASE_URL` (example: `http://localhost:8000`)
- `VITE_APP_ENV` (`development` / `staging` / `production`)

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Backend Integration Coverage

Integrated with real backend APIs (no mock runtime path in primary pages):

- Auth: `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/refresh`
- Admin global: `/api/v1/admin/organizations`, `/api/v1/admin/platform-overview`, `/api/v1/admin/api-monitoring/*`
- Agents: `/api/v1/agents`
- Policies: `/api/v1/policies`
- Threats + investigation: `/api/v1/threats`, `/api/v1/threats/{id}/investigation`
- Audit logs + export: `/api/v1/audit-logs`, `/api/v1/exports/audit`
- Settings: `/api/v1/users/me`, `/api/v1/organizations/current`, `/api/v1/integrations`, `/api/v1/api-keys`
- Health + metrics: `/api/v1/health/*`, `/api/v1/system/metrics`

## Contributor Notes

- Keep API calls inside `src/app/api/services/*`.
- Keep transport and UI separated (typed DTOs in `src/app/api/types/*`).
- For new pages, add endpoint constants in `src/app/api/endpoints.ts` and service wrappers first.
- Preserve response envelope assumptions (`{ success, data, message }`).

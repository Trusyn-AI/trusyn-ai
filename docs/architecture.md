# Trusyn AI Architecture

## Monorepo Layout

```txt
Trusyn_AI/
  frontend/
    landing-page/
    web-app/
  backend/
  docs/
```

## Frontend

- `frontend/landing-page`
  - public marketing site
  - product narrative, architecture, features, and CTA
- `frontend/web-app`
  - authenticated product interface
  - dashboard, threats, policies, audit logs, analytics, settings

## Backend

- `backend/app/api/routes`
  - REST endpoints for agents, threats, policies, analytics, audit logs, and auth
- `backend/app/services`
  - reusable backend logic for alerts, audits, and analytics
- `backend/app/governance`
  - prompt inspection, exfiltration detection, risk scoring, decisioning
- `backend/app/policies`
  - policy definitions and evaluation logic
- `backend/app/models`
  - domain schemas and API models
- `backend/app/db`
  - persistence and database setup
- `backend/app/integrations`
  - Gemini and data-platform integrations
- `backend/app/auth`
  - auth and role-based access helpers
- `backend/app/utils`
  - config and shared utilities

## Runtime Flow

1. The frontend sends an agent request to the backend API.
2. The backend forwards the request to the governance layer.
3. The governance layer evaluates risk, policy, and action intent.
4. A final decision is returned: allow, block, review, quarantine, or log.
5. Events are written to audit and analytics pipelines.
6. The dashboard surfaces the result to operators in real time.

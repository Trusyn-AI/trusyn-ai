# Trusyn AI Backend

Production-oriented backend for Trusyn AI: runtime governance, threat detection, policy enforcement, and enterprise observability for autonomous AI systems.

## Implemented Phases
- Phase 1: FastAPI foundation, config, logging, Docker, health checks
- Phase 2: Multi-tenant SaaS data architecture
- Phase 3: JWT auth, RBAC, tenant isolation, onboarding
- Phase 4: Agent/policy/threat operational APIs + service/repository layers
- Phase 5: Runtime governance engine + gateway proxy decision pipeline
- Phase 6: Real-time event bus + websocket streaming + telemetry
- Phase 7: Production hardening, cache layer, resilience, CI/CD foundations

## Architecture Highlights
- API: FastAPI + async SQLAlchemy + PostgreSQL
- Runtime governance: threat detector → policy engine → risk engine → decision engine
- Eventing: async event bus + stream retention + websocket broadcast subscriber
- Security hardening:
  - rate limiting (auth/gateway/threat/ws)
  - request hardening (payload size, malformed JSON, timeout)
  - security headers middleware
  - API version guard + deprecation headers
- Observability:
  - in-memory metrics registry + Prometheus text endpoint
  - trace context + nested spans
  - periodic runtime health metrics and health event stream
- Resilience:
  - retry + timeout + circuit breaker utilities
  - Gemini service hardening (retries/timeouts/rate controls/circuit fallback)
- Caching:
  - Redis-ready cache abstraction with graceful local fallback
  - active policies, org settings, metrics snapshots, session metadata

## API Endpoints

### Health
- `GET /health`
- `GET /health/db`
- `GET /health/cache`
- `GET /health/ws`
- `GET /health/governance`

### System
- `GET /api/v1/`
- `GET /api/v1/metrics` (SUPER_ADMIN)
- `GET /api/v1/metrics/prometheus` (SUPER_ADMIN)
- `GET /api/v1/ws/channels`

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

### Operational APIs
- Agents: `POST/GET/PATCH/DELETE /api/v1/agents`
- Policies: `POST/GET/PATCH/DELETE /api/v1/policies`
- Threats: `POST /api/v1/threats/ingest`, `GET /api/v1/threats`
- Gateway runtime: `POST /api/v1/gateway/request`

### Compliance Exports
- `GET /api/v1/exports/audit?format=json|csv`
- `GET /api/v1/exports/governance-decisions?format=json|csv`

### WebSocket
- `/ws/platform`
- `/ws/organizations/{organization_id}`
- `/ws/threats`
- `/ws/governance`

Auth:
- `Authorization: Bearer <token>` header
- or `?token=<access_token>` query param

## Local Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

## Docker
```bash
cd backend
docker-compose up --build
```

Services:
- `backend` (FastAPI)
- `postgres` (PostgreSQL 16)
- `redis` (Redis 7)

## Testing
```bash
cd backend
pytest tests -q
python -m compileall app tests
```

## CI/CD Foundations
Workflows in `.github/workflows/`:
- `lint.yml` (ruff + compile check)
- `test.yml` (pytest)
- `docker-build.yml` (container build validation)

## Environment Variables
See `.env.example` for all production tunables:
- DB pool sizing
- Redis/cache settings
- rate limiting controls
- websocket limits
- request hardening controls
- security headers
- Gemini resilience settings
- observability/task scheduler controls


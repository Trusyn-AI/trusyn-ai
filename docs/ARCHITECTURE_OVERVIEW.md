# Architecture Overview

## Purpose

This document describes the high-level architecture of the Trusyn AI platform and the responsibilities of core runtime components.

## System Boundaries

Trusyn AI sits between autonomous AI agents and enterprise systems/models.

```text
Agent Runtime -> Trusyn Gateway -> Governance Pipeline -> Decision -> Target Model/API
```

## Core Backend Modules

- `api/`: route layer and dependency wiring
- `services/`: business workflows and orchestration
- `repositories/`: persistence access patterns
- `engine/`: governance, policy, threat, risk, decision modules
- `events/`: event bus and streaming abstractions
- `observability/`: metrics, tracing, telemetry
- `middleware/`: security, rate limiting, request protections

## Governance Pipeline

1. Request received at gateway
2. Threat detector evaluates prompt/action risk signals
3. Policy engine evaluates active rules for the tenant
4. Risk engine computes score/confidence/severity
5. Decision engine determines enforcement action
6. Audit and governance events are persisted and streamed

## Multi-Tenant Model

- organization-scoped entities
- JWT-authenticated requests
- RBAC-based authorization
- tenant isolation enforced in service/repository paths

## Frontend Applications

- `landing-page`: product narrative and platform positioning
- `web-app`: organization operator experience
- `admin_panel`: super admin global operations

## Deployment Profile

- Backend containerized via Dockerfile
- Local stack via `backend/docker-compose.yml`
- CI builds and validation through GitHub Actions workflows

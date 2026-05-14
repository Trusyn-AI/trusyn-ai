# Security Checklist

Use this checklist before each public release.

## Secrets and credentials

- [ ] No hardcoded tokens, keys, or passwords in tracked files
- [ ] `.env` files are gitignored
- [ ] `.env.example` files contain placeholders only

## API security

- [ ] Auth-required endpoints enforce JWT validation
- [ ] RBAC checks are present for privileged routes
- [ ] Tenant isolation checks validated for org-scoped data

## Runtime hardening

- [ ] Rate limiting enabled for sensitive endpoints
- [ ] Security headers middleware enabled
- [ ] Request size and timeout protections configured

## Observability

- [ ] Health endpoints return expected status
- [ ] Logging and telemetry paths are operational
- [ ] Audit events are persisted for critical actions

## Release governance

- [ ] SECURITY.md is current
- [ ] Vulnerability reporting path is configured
- [ ] Dependencies reviewed for high-severity advisories

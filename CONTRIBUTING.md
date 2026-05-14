# Contributing to Trusyn AI

Thank you for contributing to the Trusyn AI platform.

## Contribution Principles

- Keep security, tenant isolation, and reliability as first-class requirements.
- Prefer clear, maintainable architecture over short-term shortcuts.
- Align changes with existing module boundaries (routes, services, repositories, schemas).

## Development Setup

1. Fork the repository and clone your fork.
2. Create a feature branch from `develop`.
3. Configure environment files from `.env.example` files.
4. Run backend and frontend services locally.

## Branching Strategy

- `main`: production-ready, stable branch.
- `develop`: integration branch for upcoming release work.
- `feature/*`: new functionality.
- `hotfix/*`: urgent fixes.
- `release/*`: release staging branches.

## Commit Guidelines

Use clear commits that explain intent and scope.

Recommended format:
- `feat: add admin platform overview endpoint`
- `fix: enforce org scope in audit query`
- `docs: update deployment setup`

## Pull Request Process

1. Open PR against `develop` unless explicitly instructed otherwise.
2. Complete the pull request template.
3. Link related issue(s).
4. Include tests and/or validation notes.
5. Request review from maintainers.

## Code Quality Expectations

- Type-safe code in TypeScript and Python.
- No secrets or credentials committed.
- No mock/demo-only runtime behavior in production code paths.
- Add or update tests for behavior changes.
- Keep OpenAPI/API contracts stable unless versioned.

## Security-Sensitive Changes

For auth, RBAC, policy, threat, or data-isolation changes:
- Include explicit test coverage for authorization and tenant boundaries.
- Document potential migration or backward compatibility impact.

## Questions and Support

- Use GitHub Discussions for architecture and usage questions.
- Use Issues for bugs and feature requests.
- Use SECURITY.md process for vulnerability reports.

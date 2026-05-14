# Security Policy

The Trusyn AI platform treats security reports as high-priority operational events.

## Supported Versions

Security fixes are prioritized for:
- `main` (latest stable)
- active `release/*` branches

## Reporting a Vulnerability

Please do not open public issues for suspected vulnerabilities.

Report privately with:
- impact summary
- reproduction steps
- affected components
- proof-of-concept (if available)

Preferred channel:
- security contact email maintained by repository owners (configure this before launch)

## Response Targets

- Initial acknowledgment: within 72 hours
- Triage status update: within 7 days
- Remediation target: based on severity and exploitability

## Disclosure Process

1. Receive private report
2. Confirm and triage severity
3. Develop and validate fix
4. Coordinate disclosure timeline with reporter
5. Publish advisory and release notes

## Scope Expectations

In scope examples:
- auth bypass
- tenant isolation bypass
- privilege escalation
- sensitive data exposure
- command or query injection

Out of scope examples:
- social engineering
- denial of service without practical exploit path
- issues in unsupported forks or outdated branches

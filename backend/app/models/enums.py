from enum import StrEnum


class UserRole(StrEnum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ORG_ADMIN = "ORG_ADMIN"
    ANALYST = "ANALYST"
    DEVELOPER = "DEVELOPER"


class AgentStatus(StrEnum):
    OPERATIONAL = "OPERATIONAL"
    WARNING = "WARNING"
    QUARANTINED = "QUARANTINED"
    BLOCKED = "BLOCKED"


class ThreatSeverity(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class GovernanceDecisionType(StrEnum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    REVIEW = "REVIEW"
    QUARANTINE = "QUARANTINE"
    RATE_LIMIT = "RATE_LIMIT"


class OrganizationStatus(StrEnum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    TRIAL = "TRIAL"
    DISABLED = "DISABLED"

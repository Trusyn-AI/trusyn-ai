from enum import StrEnum


class Environment(StrEnum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class ServiceStatus(StrEnum):
    OK = "ok"
    ERROR = "error"


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"


REQUEST_ID_HEADER = "X-Request-ID"
DEFAULT_TIMEZONE = "UTC"

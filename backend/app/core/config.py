from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "Trusyn AI Backend"
    app_env: Literal["development", "staging", "production"] = "development"
    app_version: str = "0.1.0"
    debug: bool = True

    api_v1_prefix: str = "/api/v1"
    api_deprecation_notice: str | None = None
    api_supported_versions: list[str] = ["v1"]

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/trusyn_ai"
    sqlalchemy_echo: bool = False
    sqlalchemy_pool_pre_ping: bool = True
    sqlalchemy_pool_size: int = 20
    sqlalchemy_max_overflow: int = 40
    sqlalchemy_pool_timeout: int = 30
    sqlalchemy_pool_recycle: int = 1800

    secret_key: str = "change_me_in_production"
    refresh_secret_key: str | None = None
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 10080
    jwt_issuer: str = "trusyn-ai"

    gemini_api_key: str = ""
    gemini_timeout_seconds: int = 15
    gemini_retry_attempts: int = 2
    gemini_retry_backoff_seconds: float = 0.5
    gemini_circuit_fail_threshold: int = 5
    gemini_circuit_recovery_seconds: int = 60
    gemini_rate_limit_per_window: int = 120

    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    log_json: bool = False

    event_bus_queue_size: int = 5000
    event_retention_limit: int = 500
    ws_heartbeat_interval_seconds: int = 20
    ws_max_message_size: int = 65536
    ws_idle_timeout_seconds: int = 120
    ws_max_connections_global: int = 2000
    ws_max_connections_per_org: int = 300
    ws_max_subscriptions_per_connection: int = 16
    ws_broadcast_batch_size: int = 200
    health_stream_interval_seconds: int = 30

    rate_limit_enabled: bool = True
    rate_limit_window_seconds: int = 60
    rate_limit_auth_per_window: int = 15
    rate_limit_gateway_per_window: int = 120
    rate_limit_threat_ingest_per_window: int = 120
    rate_limit_ws_connect_per_window: int = 60
    rate_limit_default_per_window: int = 300

    request_timeout_seconds: int = 30
    request_max_body_bytes: int = 1048576
    request_hardening_enabled: bool = True

    security_headers_enabled: bool = True
    csp_policy: str = "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
    hsts_max_age_seconds: int = 31536000

    redis_enabled: bool = True
    redis_url: str = "redis://localhost:6379/0"
    redis_default_ttl_seconds: int = 300
    redis_connect_timeout_seconds: int = 2

    metrics_enabled: bool = True
    metrics_cache_ttl_seconds: int = 15
    task_scheduler_enabled: bool = True

    @field_validator("app_env", mode="before")
    @classmethod
    def _normalize_app_env(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"prod", "release"}:
                return "production"
            return normalized
        return value

    @field_validator("api_v1_prefix", mode="before")
    @classmethod
    def _normalize_api_prefix(cls, value: object) -> object:
        if isinstance(value, str):
            prefix = value.strip()
            if not prefix:
                return "/api/v1"
            if not prefix.startswith("/"):
                return f"/{prefix}"
            return prefix
        return value

    @field_validator("debug", mode="before")
    @classmethod
    def _normalize_debug(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "production"}:
                return False
        return value

    @field_validator("refresh_secret_key", mode="before")
    @classmethod
    def _normalize_refresh_secret_key(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("api_supported_versions", mode="before")
    @classmethod
    def _parse_api_supported_versions(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    current = Settings()
    if not current.refresh_secret_key:
        current.refresh_secret_key = current.secret_key
    return current


settings = get_settings()

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from time import time
from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse
from jose import JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings
from app.core.security import decode_token
from app.schemas.common import ErrorDetail, ErrorResponse


@dataclass(slots=True)
class Bucket:
    count: int
    reset_at: float


class InMemoryRateLimiter:
    """Simple fixed-window limiter for API and websocket protections.

    Storage abstraction is intentionally simple and can be replaced with Redis.
    """

    def __init__(self, window_seconds: int) -> None:
        self._window_seconds = window_seconds
        self._buckets: dict[str, Bucket] = {}
        self._lock = asyncio.Lock()

    async def hit(self, key: str, *, limit: int) -> tuple[bool, int]:
        now = time()
        async with self._lock:
            bucket = self._buckets.get(key)
            if bucket is None or now >= bucket.reset_at:
                bucket = Bucket(count=0, reset_at=now + self._window_seconds)
                self._buckets[key] = bucket

            if bucket.count >= limit:
                retry_after = max(1, int(bucket.reset_at - now))
                return False, retry_after

            bucket.count += 1
            return True, max(1, int(bucket.reset_at - now))

    async def cleanup(self) -> None:
        now = time()
        async with self._lock:
            expired_keys = [key for key, bucket in self._buckets.items() if now >= bucket.reset_at]
            for key in expired_keys:
                self._buckets.pop(key, None)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app) -> None:
        super().__init__(app)
        self._limiter = rate_limiter

    async def dispatch(self, request: Request, call_next) -> Response:
        if not settings.rate_limit_enabled:
            return await call_next(request)

        ip = _extract_client_ip(request)
        user_id, org_id = _extract_subjects(request)
        limit = _resolve_limit(request.url.path)

        keys = [f"path:{request.url.path}:ip:{ip}"]
        if user_id:
            keys.append(f"path:{request.url.path}:user:{user_id}")
        if org_id:
            keys.append(f"path:{request.url.path}:org:{org_id}")

        retry_after = 1
        for key in keys:
            allowed, retry_after = await self._limiter.hit(key, limit=limit)
            if not allowed:
                payload = ErrorResponse(
                    request_id=getattr(request.state, "request_id", None),
                    error=ErrorDetail(
                        code="rate_limited",
                        message="Too many requests. Please retry later.",
                        details={"retry_after_seconds": retry_after},
                    ),
                )
                return JSONResponse(
                    status_code=429,
                    content=payload.model_dump(),
                    headers={"Retry-After": str(retry_after)},
                )

        return await call_next(request)


def _extract_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _extract_subjects(request: Request) -> tuple[str | None, str | None]:
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return None, None
    token = auth.split(" ", 1)[1].strip()
    if not token:
        return None, None
    try:
        payload = decode_token(token, token_type=None)
    except JWTError:
        return None, None
    return str(payload.get("sub")) if payload.get("sub") else None, str(payload.get("org_id")) if payload.get("org_id") else None


def _resolve_limit(path: str) -> int:
    if path.startswith(f"{settings.api_v1_prefix}/auth"):
        return settings.rate_limit_auth_per_window
    if path == f"{settings.api_v1_prefix}/gateway/request":
        return settings.rate_limit_gateway_per_window
    if path == f"{settings.api_v1_prefix}/threats/ingest":
        return settings.rate_limit_threat_ingest_per_window
    return settings.rate_limit_default_per_window


rate_limiter = InMemoryRateLimiter(window_seconds=settings.rate_limit_window_seconds)


async def enforce_ws_rate_limit(client_ip: str, organization_id: str | None) -> tuple[bool, int]:
    """Rate-limit websocket connection attempts."""
    limit = settings.rate_limit_ws_connect_per_window
    keys = [f"ws:ip:{client_ip}"]
    if organization_id:
        keys.append(f"ws:org:{organization_id}")

    retry_after = 1
    for key in keys:
        allowed, retry_after = await rate_limiter.hit(key, limit=limit)
        if not allowed:
            return False, retry_after
    return True, retry_after

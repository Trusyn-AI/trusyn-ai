from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Apply default security headers for enterprise SaaS deployments."""

    async def dispatch(self, request, call_next) -> Response:
        response = await call_next(request)
        if not settings.security_headers_enabled:
            return response

        response.headers["Strict-Transport-Security"] = f"max-age={settings.hsts_max_age_seconds}; includeSubDomains"
        response.headers["Content-Security-Policy"] = settings.csp_policy
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response

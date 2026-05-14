from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings
from app.schemas.common import ErrorDetail, ErrorResponse


class APIVersionMiddleware(BaseHTTPMiddleware):
    """Guards unsupported API versions and emits deprecation notices."""

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        if path.startswith("/api/"):
            parts = path.split("/")
            if len(parts) > 2:
                requested = parts[2]
                if requested.startswith("v") and requested not in settings.api_supported_versions:
                    payload = ErrorResponse(
                        request_id=getattr(request.state, "request_id", None),
                        error=ErrorDetail(
                            code="unsupported_api_version",
                            message=f"API version '{requested}' is not supported.",
                            details={"supported_versions": settings.api_supported_versions},
                        ),
                    )
                    return JSONResponse(status_code=410, content=payload.model_dump())

        response = await call_next(request)
        if settings.api_deprecation_notice:
            response.headers["X-API-Deprecation-Notice"] = settings.api_deprecation_notice
        return response


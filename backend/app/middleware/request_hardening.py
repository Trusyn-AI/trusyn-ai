from __future__ import annotations

import asyncio
import json
from json import JSONDecodeError

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings
from app.schemas.common import ErrorDetail, ErrorResponse


class RequestHardeningMiddleware(BaseHTTPMiddleware):
    """Payload size, malformed JSON, and timeout protections."""

    async def dispatch(self, request: Request, call_next) -> Response:
        if not settings.request_hardening_enabled:
            return await call_next(request)

        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > settings.request_max_body_bytes:
                    return self._error_response(
                        request,
                        status_code=413,
                        code="payload_too_large",
                        message="Request payload exceeds allowed size.",
                    )
            except ValueError:
                return self._error_response(
                    request,
                    status_code=400,
                    code="invalid_content_length",
                    message="Invalid Content-Length header.",
                )

        if request.method in {"POST", "PUT", "PATCH"}:
            body = await request.body()
            if len(body) > settings.request_max_body_bytes:
                return self._error_response(
                    request,
                    status_code=413,
                    code="payload_too_large",
                    message="Request payload exceeds allowed size.",
                )
            if b"\x00" in body:
                return self._error_response(
                    request,
                    status_code=400,
                    code="unsafe_payload",
                    message="Payload contains unsafe null-byte content.",
                )
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type and body:
                try:
                    json.loads(body)
                except JSONDecodeError:
                    return self._error_response(
                        request,
                        status_code=400,
                        code="malformed_json",
                        message="Malformed JSON payload.",
                    )
            await _restore_request_body(request, body)

        try:
            return await asyncio.wait_for(call_next(request), timeout=settings.request_timeout_seconds)
        except TimeoutError:
            return self._error_response(
                request,
                status_code=504,
                code="request_timeout",
                message="Request processing exceeded timeout threshold.",
            )

    def _error_response(self, request: Request, *, status_code: int, code: str, message: str) -> JSONResponse:
        payload = ErrorResponse(
            request_id=getattr(request.state, "request_id", None),
            error=ErrorDetail(code=code, message=message),
        )
        return JSONResponse(status_code=status_code, content=payload.model_dump())


async def _restore_request_body(request: Request, body: bytes) -> None:
    async def receive() -> dict[str, object]:
        return {"type": "http.request", "body": body, "more_body": False}

    request._receive = receive  # type: ignore[attr-defined]

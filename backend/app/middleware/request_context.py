from __future__ import annotations

from time import perf_counter
from uuid import uuid4

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.constants import REQUEST_ID_HEADER
from app.core.logging import logger
from app.observability.tracing import clear_trace_context, new_trace_context, set_trace_context


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Attach per-request metadata for tracing and diagnostics."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER, str(uuid4()))
        request.state.request_id = request_id
        request.state.request_started = perf_counter()

        trace_context = new_trace_context(request_id=request_id)
        set_trace_context(trace_context)

        logger.info(
            "request_started",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else None,
        )

        response = await call_next(request)
        elapsed_ms = round((perf_counter() - request.state.request_started) * 1000, 3)
        response.headers[REQUEST_ID_HEADER] = request_id
        response.headers["X-Response-Time-Ms"] = str(elapsed_ms)
        logger.info(
            "request_completed",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=elapsed_ms,
        )
        clear_trace_context()
        return response


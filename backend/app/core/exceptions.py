from dataclasses import dataclass

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.constants import REQUEST_ID_HEADER
from app.core.logging import logger
from app.schemas.common import ErrorDetail, ErrorResponse


@dataclass(slots=True)
class APIException(Exception):
    message: str
    error_code: str = "api_error"
    status_code: int = status.HTTP_400_BAD_REQUEST
    details: dict[str, object] | None = None


def _request_id_from(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
        payload = ErrorResponse(
            request_id=_request_id_from(request),
            error=ErrorDetail(code=exc.error_code, message=exc.message, details=exc.details)
        )
        headers = {REQUEST_ID_HEADER: _request_id_from(request)} if _request_id_from(request) else None
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump(), headers=headers)

    @app.exception_handler(RequestValidationError)
    async def request_validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        payload = ErrorResponse(
            request_id=_request_id_from(request),
            error=ErrorDetail(
                code="validation_error",
                message="Request validation failed",
                details={"errors": exc.errors()},
            ),
        )
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload.model_dump())

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        payload = ErrorResponse(
            request_id=_request_id_from(request),
            error=ErrorDetail(
                code="http_error",
                message=str(exc.detail),
                details={"status_code": exc.status_code},
            ),
        )
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception", request_id=_request_id_from(request), error=str(exc))
        payload = ErrorResponse(
            request_id=_request_id_from(request),
            error=ErrorDetail(
                code="internal_server_error",
                message="Internal server error",
                details=None,
            ),
        )
        headers = {REQUEST_ID_HEADER: _request_id_from(request)} if _request_id_from(request) else None
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=payload.model_dump(),
            headers=headers,
        )

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import APIException
from app.models.audit_log import AuditLog
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.audit_query import AuditLogQuery
from app.schemas.pagination import PaginatedResult


class AuditLogService:
    async def list_audit_logs(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        query: AuditLogQuery,
    ) -> PaginatedResult[AuditLog]:
        if query.start_at and query.end_at and query.end_at < query.start_at:
            raise APIException(
                message="end_at must be greater than or equal to start_at",
                error_code="invalid_time_range",
                status_code=422,
            )

        if query.sort_by not in {"timestamp", "severity", "event_type"}:
            raise APIException(
                message="Unsupported sort field",
                error_code="invalid_sort_field",
                status_code=422,
                details={"allowed": ["timestamp", "severity", "event_type"]},
            )

        repository = AuditLogRepository(session)
        items, total = await repository.list_filtered(current_user=current_user, query=query)
        return PaginatedResult[AuditLog](
            items=items,
            total=total,
            limit=query.limit,
            offset=query.offset,
        )

    async def get_audit_log(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        audit_log_id: uuid.UUID,
        organization_id: uuid.UUID | None = None,
    ) -> AuditLog:
        repository = AuditLogRepository(session)
        item = await repository.get_for_scope(
            audit_log_id=audit_log_id,
            current_user=current_user,
            organization_id=organization_id,
        )
        if item is None:
            raise APIException(message="Audit log not found", error_code="audit_log_not_found", status_code=404)
        return item

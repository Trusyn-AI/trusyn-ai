from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Select, asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.enums import ThreatSeverity, UserRole
from app.models.user import User
from app.schemas.audit_query import AuditLogQuery
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AuditLog)

    def _apply_scope(
        self,
        statement: Select[tuple[AuditLog]],
        *,
        current_user: User,
        organization_id: uuid.UUID | None,
    ) -> Select[tuple[AuditLog]]:
        if current_user.role == UserRole.SUPER_ADMIN and organization_id is not None:
            return statement.where(AuditLog.organization_id == organization_id)
        if current_user.role == UserRole.SUPER_ADMIN:
            return statement
        return statement.where(AuditLog.organization_id == current_user.organization_id)

    async def list_filtered(
        self,
        *,
        current_user: User,
        query: AuditLogQuery,
    ) -> tuple[list[AuditLog], int]:
        statement = select(AuditLog)
        statement = self._apply_scope(statement, current_user=current_user, organization_id=query.organization_id)

        if query.severity is not None:
            statement = statement.where(AuditLog.severity == query.severity)
        if query.event_type:
            statement = statement.where(AuditLog.event_type == query.event_type)
        if query.user_id is not None:
            statement = statement.where(AuditLog.user_id == query.user_id)
        if query.start_at is not None:
            statement = statement.where(AuditLog.timestamp >= query.start_at)
        if query.end_at is not None:
            statement = statement.where(AuditLog.timestamp <= query.end_at)
        if query.search:
            statement = statement.where(AuditLog.message.ilike(f"%{query.search.strip()}%"))

        count_statement = select(func.count()).select_from(statement.subquery())
        total = int((await self.session.scalar(count_statement)) or 0)

        sort_map = {
            "timestamp": AuditLog.timestamp,
            "severity": AuditLog.severity,
            "event_type": AuditLog.event_type,
        }
        sort_column = sort_map.get(query.sort_by, AuditLog.timestamp)
        order_by = desc(sort_column) if query.sort_order.lower() == "desc" else asc(sort_column)

        statement = statement.order_by(order_by).offset(query.offset).limit(query.limit)
        rows = await self.session.scalars(statement)
        return list(rows.all()), total

    async def get_for_scope(
        self,
        *,
        audit_log_id: uuid.UUID,
        current_user: User,
        organization_id: uuid.UUID | None = None,
    ) -> AuditLog | None:
        statement = select(AuditLog).where(AuditLog.id == audit_log_id)
        statement = self._apply_scope(statement, current_user=current_user, organization_id=organization_id)
        return await self.session.scalar(statement)

    async def timeline_for_threat(
        self,
        *,
        current_user: User,
        organization_id: uuid.UUID,
        start_at: datetime,
        end_at: datetime,
        limit: int = 50,
    ) -> list[AuditLog]:
        statement = (
            select(AuditLog)
            .where(
                AuditLog.organization_id == organization_id,
                AuditLog.timestamp >= start_at,
                AuditLog.timestamp <= end_at,
            )
            .order_by(AuditLog.timestamp.asc())
            .limit(limit)
        )
        if current_user.role != UserRole.SUPER_ADMIN:
            statement = statement.where(AuditLog.organization_id == current_user.organization_id)
        rows = await self.session.scalars(statement)
        return list(rows.all())

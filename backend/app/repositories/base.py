from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any, Generic, TypeVar

from sqlalchemy import Select, asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.models.enums import UserRole
from app.models.user import User


ModelType = TypeVar("ModelType", bound=DeclarativeBase)


class BaseRepository(Generic[ModelType]):
    """Generic async repository with tenant scoping, pagination, and soft-delete support."""

    def __init__(self, session: AsyncSession, model: type[ModelType]) -> None:
        self.session = session
        self.model = model

    def _has_attr(self, attr_name: str) -> bool:
        return hasattr(self.model, attr_name)

    def _apply_soft_delete_filter(self, statement: Select[tuple[ModelType]], include_deleted: bool) -> Select[tuple[ModelType]]:
        if not include_deleted and self._has_attr("is_deleted"):
            statement = statement.where(getattr(self.model, "is_deleted").is_(False))
        return statement

    def _apply_tenant_filter(
        self,
        statement: Select[tuple[ModelType]],
        *,
        current_user: User,
        organization_id: uuid.UUID | None,
    ) -> Select[tuple[ModelType]]:
        if not self._has_attr("organization_id"):
            return statement

        if current_user.role == UserRole.SUPER_ADMIN and organization_id is not None:
            return statement.where(getattr(self.model, "organization_id") == organization_id)

        if current_user.role == UserRole.SUPER_ADMIN and organization_id is None:
            return statement

        return statement.where(getattr(self.model, "organization_id") == current_user.organization_id)

    async def create(self, obj_in: dict[str, Any]) -> ModelType:
        instance = self.model(**obj_in)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def get_by_id(
        self,
        entity_id: uuid.UUID,
        *,
        current_user: User,
        organization_id: uuid.UUID | None = None,
        include_deleted: bool = False,
    ) -> ModelType | None:
        statement = select(self.model).where(getattr(self.model, "id") == entity_id)
        statement = self._apply_tenant_filter(statement, current_user=current_user, organization_id=organization_id)
        statement = self._apply_soft_delete_filter(statement, include_deleted)
        return await self.session.scalar(statement)

    async def list(
        self,
        *,
        current_user: User,
        organization_id: uuid.UUID | None = None,
        include_deleted: bool = False,
        limit: int = 20,
        offset: int = 0,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        filters: dict[str, Any] | None = None,
    ) -> list[ModelType]:
        statement = select(self.model)
        statement = self._apply_tenant_filter(statement, current_user=current_user, organization_id=organization_id)
        statement = self._apply_soft_delete_filter(statement, include_deleted)

        if filters:
            for field, value in filters.items():
                if value is None or not self._has_attr(field):
                    continue
                statement = statement.where(getattr(self.model, field) == value)

        sort_column = getattr(self.model, sort_by, None)
        if sort_column is None:
            sort_column = getattr(self.model, "created_at")
        statement = statement.order_by(desc(sort_column) if sort_order.lower() == "desc" else asc(sort_column))

        statement = statement.offset(offset).limit(limit)
        rows = await self.session.scalars(statement)
        return list(rows.all())

    async def count(
        self,
        *,
        current_user: User,
        organization_id: uuid.UUID | None = None,
        include_deleted: bool = False,
        filters: dict[str, Any] | None = None,
    ) -> int:
        statement = select(func.count()).select_from(self.model)
        statement = self._apply_tenant_filter(statement, current_user=current_user, organization_id=organization_id)
        statement = self._apply_soft_delete_filter(statement, include_deleted)

        if filters:
            for field, value in filters.items():
                if value is None or not self._has_attr(field):
                    continue
                statement = statement.where(getattr(self.model, field) == value)

        result = await self.session.scalar(statement)
        return int(result or 0)

    async def update(self, instance: ModelType, obj_in: dict[str, Any]) -> ModelType:
        for field, value in obj_in.items():
            if hasattr(instance, field) and value is not None:
                setattr(instance, field, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def soft_delete(self, instance: ModelType) -> None:
        if hasattr(instance, "is_deleted"):
            setattr(instance, "is_deleted", True)
            if hasattr(instance, "deleted_at"):
                setattr(instance, "deleted_at", datetime.now(UTC))
            await self.session.flush()
        else:
            await self.session.delete(instance)
            await self.session.flush()

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import enforce_tenant_access
from app.core.exceptions import APIException
from app.core.security import hash_password
from app.models.enums import ThreatSeverity, UserRole
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.audit_service import AuditService


class UserService:
    def __init__(self) -> None:
        self.audit_service = AuditService()

    async def list_users(self, session: AsyncSession, current_user: User) -> list[User]:
        statement = select(User).where(User.is_deleted.is_(False))
        if current_user.role != UserRole.SUPER_ADMIN:
            statement = statement.where(User.organization_id == current_user.organization_id)
        users = (await session.scalars(statement.order_by(User.created_at.desc()))).all()
        return list(users)

    async def create_user(self, session: AsyncSession, current_user: User, payload: UserCreate) -> User:
        enforce_tenant_access(current_user, payload.organization_id)

        if current_user.role != UserRole.SUPER_ADMIN and payload.role == UserRole.SUPER_ADMIN:
            raise APIException(
                message="Only super admins can assign SUPER_ADMIN role",
                error_code="forbidden_role_assignment",
                status_code=403,
            )

        existing = await session.scalar(select(User).where(User.email == payload.email))
        if existing is not None:
            raise APIException(message="Email already exists", error_code="email_conflict", status_code=409)

        user = User(
            organization_id=payload.organization_id,
            email=payload.email,
            full_name=payload.full_name,
            password_hash=hash_password(payload.password),
            role=payload.role,
            is_active=payload.is_active,
            avatar_url=payload.avatar_url,
            preferences_json=payload.preferences,
        )
        session.add(user)

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="user_created",
            severity=ThreatSeverity.LOW,
            message=f"User '{user.email}' created",
            metadata={"role": user.role.value},
        )

        try:
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            raise APIException(
                message="Unable to create user",
                error_code="user_create_failed",
                status_code=400,
            ) from exc
        await session.refresh(user)
        return user

    async def update_user(
        self,
        session: AsyncSession,
        current_user: User,
        user_id: uuid.UUID,
        payload: UserUpdate,
    ) -> User:
        user = await session.scalar(select(User).where(User.id == user_id, User.is_deleted.is_(False)))
        if user is None:
            raise APIException(message="User not found", error_code="user_not_found", status_code=404)

        enforce_tenant_access(current_user, user.organization_id)

        if payload.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
            raise APIException(
                message="Only super admins can assign SUPER_ADMIN role",
                error_code="forbidden_role_assignment",
                status_code=403,
            )

        updates = payload.model_dump(exclude_unset=True)

        if payload.full_name is not None:
            user.full_name = payload.full_name
        if payload.role is not None:
            user.role = payload.role
        if payload.is_active is not None:
            user.is_active = payload.is_active
        if payload.last_login_at is not None:
            user.last_login_at = payload.last_login_at
        if payload.avatar_url is not None:
            user.avatar_url = payload.avatar_url
        if payload.preferences is not None:
            user.preferences_json = payload.preferences
        if payload.password is not None:
            user.password_hash = hash_password(payload.password)

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="user_updated",
            severity=ThreatSeverity.LOW,
            message=f"User '{user.email}' updated",
            metadata={"user_id": str(user.id), "updated_fields": list(updates.keys())},
        )

        try:
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            raise APIException(
                message="Unable to update user",
                error_code="user_update_failed",
                status_code=400,
            ) from exc
        await session.refresh(user)
        return user

    async def delete_user(self, session: AsyncSession, current_user: User, user_id: uuid.UUID) -> None:
        user = await session.scalar(select(User).where(User.id == user_id, User.is_deleted.is_(False)))
        if user is None:
            raise APIException(message="User not found", error_code="user_not_found", status_code=404)

        enforce_tenant_access(current_user, user.organization_id)

        if user.id == current_user.id:
            raise APIException(
                message="Users cannot delete themselves",
                error_code="self_delete_forbidden",
                status_code=400,
            )

        user.is_active = False
        user.is_deleted = True

        await self.audit_service.create_user_action_event(
            session,
            actor=current_user,
            event_type="user_deactivated",
            severity=ThreatSeverity.MEDIUM,
            message=f"User '{user.email}' deactivated",
            metadata={"user_id": str(user.id)},
        )
        await session.commit()

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.cache_keys import CacheKeys
from app.cache.cache_service import cache_service
from app.core.config import settings
from app.core.exceptions import APIException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.enums import OrganizationStatus, UserRole
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.organization import OrganizationResponse
from app.schemas.user import UserResponse


class AuthService:
    async def register_organization_admin(
        self,
        session: AsyncSession,
        payload: RegisterRequest,
    ) -> TokenResponse:
        existing_org = await session.scalar(
            select(Organization).where(Organization.slug == payload.organization_slug)
        )
        if existing_org is not None:
            raise APIException(
                message="Organization slug already exists",
                error_code="slug_conflict",
                status_code=409,
            )

        existing_user = await session.scalar(select(User).where(User.email == payload.email))
        if existing_user is not None:
            raise APIException(
                message="Email already registered",
                error_code="email_conflict",
                status_code=409,
            )

        organization = Organization(
            name=payload.organization_name,
            slug=payload.organization_slug,
            status=OrganizationStatus.TRIAL,
        )
        admin_user = User(
            organization=organization,
            full_name=payload.admin_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=UserRole.ORG_ADMIN,
            is_active=True,
        )

        session.add(organization)
        session.add(admin_user)

        try:
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            raise APIException(
                message="Unable to register organization",
                error_code="registration_failed",
                status_code=400,
            ) from exc

        await session.refresh(organization)
        await session.refresh(admin_user)

        tokens = self.generate_tokens(admin_user, organization)
        await cache_service.set_json(
            CacheKeys.user_session(admin_user.id),
            {
                "user_id": str(admin_user.id),
                "organization_id": str(admin_user.organization_id),
                "role": admin_user.role.value,
                "issued_at": datetime.now(UTC).isoformat(),
            },
            ttl_seconds=settings.access_token_expire_minutes * 60,
        )
        return tokens

    async def authenticate_user(
        self,
        session: AsyncSession,
        payload: LoginRequest,
    ) -> TokenResponse:
        statement = select(User).where(User.email == payload.email, User.is_deleted.is_(False))
        user = await session.scalar(statement)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise APIException(
                message="Invalid email or password",
                error_code="invalid_credentials",
                status_code=401,
            )

        if not user.is_active:
            raise APIException(
                message="Account is inactive",
                error_code="inactive_user",
                status_code=403,
            )

        organization = await session.scalar(
            select(Organization).where(Organization.id == user.organization_id, Organization.is_deleted.is_(False))
        )
        if organization is None:
            raise APIException(
                message="Associated organization not found",
                error_code="organization_not_found",
                status_code=404,
            )

        user.last_login_at = datetime.now(UTC)
        await session.commit()
        await session.refresh(user)

        tokens = self.generate_tokens(user, organization)
        await cache_service.set_json(
            CacheKeys.user_session(user.id),
            {
                "user_id": str(user.id),
                "organization_id": str(user.organization_id),
                "role": user.role.value,
                "issued_at": datetime.now(UTC).isoformat(),
            },
            ttl_seconds=settings.access_token_expire_minutes * 60,
        )
        return tokens

    def generate_tokens(self, user: User, organization: Organization) -> TokenResponse:
        access_token = create_access_token(
            subject=str(user.id),
            organization_id=str(user.organization_id),
            role=user.role.value,
        )
        refresh_token = create_refresh_token(
            subject=str(user.id),
            organization_id=str(user.organization_id),
            role=user.role.value,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires_in=settings.access_token_expire_minutes * 60,
            refresh_token_expires_in=settings.refresh_token_expire_minutes * 60,
            user=UserResponse.model_validate(user),
            organization=OrganizationResponse.model_validate(organization),
        )

    async def refresh_access_token(self, session: AsyncSession, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
        except Exception as exc:
            raise APIException(
                message="Invalid refresh token",
                error_code="invalid_refresh_token",
                status_code=401,
            ) from exc

        if payload.get("typ") != "refresh":
            raise APIException(
                message="Invalid token type",
                error_code="invalid_refresh_token",
                status_code=401,
            )

        user_id = payload.get("sub")
        org_id = payload.get("org_id")

        if not user_id or not org_id:
            raise APIException(
                message="Malformed token",
                error_code="invalid_refresh_token",
                status_code=401,
            )

        parsed_user_id = uuid.UUID(str(user_id))

        user = await session.scalar(select(User).where(User.id == parsed_user_id, User.is_deleted.is_(False)))
        if user is None or not user.is_active:
            raise APIException(
                message="User not eligible for token refresh",
                error_code="invalid_refresh_token",
                status_code=401,
            )

        if str(user.organization_id) != str(org_id):
            raise APIException(
                message="Tenant mismatch in token",
                error_code="invalid_refresh_token",
                status_code=401,
            )

        organization = await session.scalar(
            select(Organization).where(Organization.id == user.organization_id, Organization.is_deleted.is_(False))
        )
        if organization is None:
            raise APIException(
                message="Organization not found",
                error_code="organization_not_found",
                status_code=404,
            )

        tokens = self.generate_tokens(user, organization)
        await cache_service.set_json(
            CacheKeys.user_session(user.id),
            {
                "user_id": str(user.id),
                "organization_id": str(user.organization_id),
                "role": user.role.value,
                "issued_at": datetime.now(UTC).isoformat(),
            },
            ttl_seconds=settings.access_token_expire_minutes * 60,
        )
        return tokens

from __future__ import annotations

import uuid
from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.db import get_db_session
from app.core.constants import TokenType
from app.core.exceptions import APIException
from app.core.security import decode_token
from app.models.enums import UserRole
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _permissions_for_role(role: UserRole) -> list[str]:
    permission_map = {
        UserRole.SUPER_ADMIN: ["platform:admin", "org:manage", "user:manage", "read:all"],
        UserRole.ORG_ADMIN: ["org:manage", "user:manage", "read:org"],
        UserRole.ANALYST: ["read:org", "threat:analyze"],
        UserRole.DEVELOPER: ["read:org", "agent:manage"],
    }
    return permission_map.get(role, ["read:org"])


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    credentials_error = APIException(
        message="Could not validate credentials",
        error_code="invalid_credentials",
        status_code=status.HTTP_401_UNAUTHORIZED,
        details={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token, token_type=TokenType.ACCESS)
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_error
        parsed_user_id = uuid.UUID(str(user_id))
    except (JWTError, ValueError, TypeError) as exc:
        raise credentials_error from exc

    statement = select(User).where(User.id == parsed_user_id, User.is_deleted.is_(False))
    user = await session.scalar(statement)
    if user is None:
        raise credentials_error

    token_org_id = payload.get("org_id")
    if token_org_id and str(user.organization_id) != str(token_org_id):
        raise credentials_error

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not current_user.is_active:
        raise APIException(
            message="User account is inactive",
            error_code="inactive_user",
            status_code=status.HTTP_403_FORBIDDEN,
        )
    return current_user


def require_role(roles: list[UserRole]) -> Callable[[User], User]:
    async def _role_dependency(current_user: Annotated[User, Depends(get_current_active_user)]) -> User:
        if current_user.role not in roles:
            raise APIException(
                message="Insufficient permissions",
                error_code="forbidden",
                status_code=status.HTTP_403_FORBIDDEN,
                details={"required_roles": [role.value for role in roles]},
            )
        return current_user

    return _role_dependency


async def require_super_admin(
    current_user: Annotated[User, Depends(require_role([UserRole.SUPER_ADMIN]))],
) -> User:
    return current_user


async def require_org_admin(
    current_user: Annotated[
        User,
        Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN])),
    ],
) -> User:
    return current_user


def enforce_tenant_access(current_user: User, target_organization_id: uuid.UUID) -> None:
    """Restrict non-super-admin users to their own organization."""
    if current_user.role == UserRole.SUPER_ADMIN:
        return
    if current_user.organization_id != target_organization_id:
        raise APIException(
            message="Cross-tenant access is forbidden",
            error_code="tenant_forbidden",
            status_code=status.HTTP_403_FORBIDDEN,
        )


def user_permissions(current_user: User) -> list[str]:
    return _permissions_for_role(current_user.role)

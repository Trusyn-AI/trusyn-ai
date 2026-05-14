from __future__ import annotations

import uuid

from app.core.exceptions import APIException
from app.models.enums import UserRole
from app.models.user import User


class BaseService:
    """Base service with shared tenant and role utilities."""

    @staticmethod
    def resolve_organization_id(current_user: User, requested_organization_id: uuid.UUID | None = None) -> uuid.UUID:
        if current_user.role == UserRole.SUPER_ADMIN and requested_organization_id is not None:
            return requested_organization_id
        if current_user.role == UserRole.SUPER_ADMIN and requested_organization_id is None:
            return current_user.organization_id
        return current_user.organization_id

    @staticmethod
    def ensure_same_tenant(current_user: User, target_organization_id: uuid.UUID) -> None:
        if current_user.role == UserRole.SUPER_ADMIN:
            return
        if current_user.organization_id != target_organization_id:
            raise APIException(
                message="Cross-tenant access is forbidden",
                error_code="tenant_forbidden",
                status_code=403,
            )

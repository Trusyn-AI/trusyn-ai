from __future__ import annotations

from sqlalchemy import Select

from app.models.enums import UserRole
from app.models.user import User


def apply_tenant_scope(statement: Select, current_user: User, organization_field) -> Select:
    """Apply tenant scoping for organization-bound models."""
    if current_user.role == UserRole.SUPER_ADMIN:
        return statement
    return statement.where(organization_field == current_user.organization_id)

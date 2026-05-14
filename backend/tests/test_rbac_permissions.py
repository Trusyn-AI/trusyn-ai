from __future__ import annotations

import uuid

from app.api.deps.auth import user_permissions
from app.models.enums import UserRole
from app.models.user import User


def _build_user(role: UserRole) -> User:
    return User(
        organization_id=uuid.uuid4(),
        email=f"{role.value.lower()}@example.com",
        full_name="RBAC User",
        password_hash="hash",
        role=role,
        is_active=True,
    )


def test_rbac_permissions_super_admin_contains_platform_admin() -> None:
    permissions = user_permissions(_build_user(UserRole.SUPER_ADMIN))
    assert "platform:admin" in permissions
    assert "read:all" in permissions


def test_rbac_permissions_org_admin_contains_org_manage() -> None:
    permissions = user_permissions(_build_user(UserRole.ORG_ADMIN))
    assert "org:manage" in permissions
    assert "user:manage" in permissions

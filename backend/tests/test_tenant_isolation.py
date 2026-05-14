from __future__ import annotations

import uuid

import pytest

from app.api.deps.auth import enforce_tenant_access
from app.core.exceptions import APIException
from app.models.enums import UserRole
from app.models.user import User


def _build_user(role: UserRole, org_id: uuid.UUID) -> User:
    return User(
        organization_id=org_id,
        email=f"{role.value.lower()}@example.com",
        full_name="Test User",
        password_hash="hash",
        role=role,
        is_active=True,
    )


def test_enforce_tenant_access_blocks_cross_org_for_non_super_admin() -> None:
    actor_org = uuid.uuid4()
    target_org = uuid.uuid4()
    user = _build_user(UserRole.ORG_ADMIN, actor_org)

    with pytest.raises(APIException) as exc:
        enforce_tenant_access(user, target_org)

    assert exc.value.status_code == 403
    assert exc.value.error_code == "tenant_forbidden"


def test_enforce_tenant_access_allows_super_admin_cross_org() -> None:
    actor_org = uuid.uuid4()
    target_org = uuid.uuid4()
    user = _build_user(UserRole.SUPER_ADMIN, actor_org)

    enforce_tenant_access(user, target_org)

from __future__ import annotations

import uuid
from dataclasses import dataclass

from fastapi import WebSocket
from jose import JWTError
from sqlalchemy import select

from app.core.constants import TokenType
from app.core.security import decode_token
from app.db.session import async_session_factory
from app.models.enums import UserRole
from app.models.user import User


class WebSocketAuthError(Exception):
    pass


@dataclass(slots=True)
class WSPrincipal:
    user_id: uuid.UUID
    organization_id: uuid.UUID
    role: UserRole
    email: str
    full_name: str

    @property
    def is_super_admin(self) -> bool:
        return self.role == UserRole.SUPER_ADMIN


def _extract_token(websocket: WebSocket) -> str | None:
    auth_header = websocket.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()

    query_token = websocket.query_params.get("token")
    if query_token:
        return query_token.strip()

    alt_query_token = websocket.query_params.get("access_token")
    if alt_query_token:
        return alt_query_token.strip()

    return None


async def authenticate_websocket(websocket: WebSocket) -> WSPrincipal:
    token = _extract_token(websocket)
    if not token:
        raise WebSocketAuthError("Missing bearer token")

    try:
        payload = decode_token(token, token_type=TokenType.ACCESS)
        user_id = uuid.UUID(str(payload.get("sub")))
    except (JWTError, ValueError, TypeError) as exc:
        raise WebSocketAuthError("Invalid access token") from exc

    async with async_session_factory() as session:
        statement = select(User).where(User.id == user_id, User.is_deleted.is_(False))
        user = await session.scalar(statement)

    if user is None:
        raise WebSocketAuthError("User not found")
    if not user.is_active:
        raise WebSocketAuthError("Inactive user")

    token_org_id = payload.get("org_id")
    if token_org_id and str(user.organization_id) != str(token_org_id):
        raise WebSocketAuthError("Token tenant mismatch")

    return WSPrincipal(
        user_id=user.id,
        organization_id=user.organization_id,
        role=user.role,
        email=user.email,
        full_name=user.full_name,
    )


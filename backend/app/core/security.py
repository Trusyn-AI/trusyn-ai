"""Authentication and JWT security utilities."""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.constants import TokenType


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _build_token_payload(
    *,
    subject: str,
    organization_id: str,
    role: str,
    token_type: TokenType,
    expires_delta: timedelta,
    additional_claims: dict[str, Any] | None = None,
) -> dict[str, Any]:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "org_id": organization_id,
        "role": role,
        "typ": token_type.value,
        "iat": now,
        "nbf": now,
        "exp": now + expires_delta,
        "iss": settings.jwt_issuer,
    }
    if additional_claims:
        payload.update(additional_claims)
    return payload


def create_access_token(
    *,
    subject: str,
    organization_id: str,
    role: str,
    additional_claims: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    ttl = expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    payload = _build_token_payload(
        subject=subject,
        organization_id=organization_id,
        role=role,
        token_type=TokenType.ACCESS,
        expires_delta=ttl,
        additional_claims=additional_claims,
    )
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(
    *,
    subject: str,
    organization_id: str,
    role: str,
    additional_claims: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    ttl = expires_delta or timedelta(minutes=settings.refresh_token_expire_minutes)
    payload = _build_token_payload(
        subject=subject,
        organization_id=organization_id,
        role=role,
        token_type=TokenType.REFRESH,
        expires_delta=ttl,
        additional_claims=additional_claims,
    )
    return jwt.encode(payload, settings.refresh_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str, *, token_type: TokenType | None = None) -> dict[str, Any]:
    """Decode and validate JWT payload.

    Raises jose.JWTError when token is invalid or token type mismatches.
    """

    secrets: list[str] = [settings.secret_key]
    if settings.refresh_secret_key != settings.secret_key:
        secrets.append(settings.refresh_secret_key)

    last_error: Exception | None = None
    payload: dict[str, Any] | None = None

    for secret in secrets:
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=[settings.jwt_algorithm],
                issuer=settings.jwt_issuer,
                options={"verify_aud": False},
            )
            break
        except JWTError as exc:
            last_error = exc

    if payload is None:
        raise JWTError("Invalid token") from last_error

    if token_type and payload.get("typ") != token_type.value:
        raise JWTError("Invalid token type")

    return payload

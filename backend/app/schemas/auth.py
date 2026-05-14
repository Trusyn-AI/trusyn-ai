from app.schemas.base import ORMModel
from app.schemas.organization import OrganizationResponse
from app.schemas.user import UserResponse


class RegisterRequest(ORMModel):
    organization_name: str
    organization_slug: str
    admin_name: str
    email: str
    password: str


class LoginRequest(ORMModel):
    email: str
    password: str


class RefreshTokenRequest(ORMModel):
    refresh_token: str


class TokenResponse(ORMModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    access_token_expires_in: int
    refresh_token_expires_in: int
    user: UserResponse
    organization: OrganizationResponse


class CurrentUserResponse(ORMModel):
    user: UserResponse
    organization: OrganizationResponse
    role: str
    permissions: list[str]

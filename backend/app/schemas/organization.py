from pydantic import AliasChoices, Field

from app.models.enums import OrganizationStatus
from app.schemas.base import BaseEntitySchema, ORMModel, SoftDeleteSchema


class OrganizationBase(ORMModel):
    name: str
    slug: str
    description: str | None = None
    plan: str = "starter"
    status: OrganizationStatus = OrganizationStatus.ACTIVE
    website: str | None = None
    settings: dict[str, object] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("settings", "settings_json"),
    )


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(ORMModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    plan: str | None = None
    status: OrganizationStatus | None = None
    website: str | None = None
    settings: dict[str, object] | None = None


class OrganizationResponse(OrganizationBase, BaseEntitySchema, SoftDeleteSchema):
    pass

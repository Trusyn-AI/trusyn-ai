from typing import Any
from uuid import UUID

from pydantic import field_validator

from app.models.enums import GovernanceDecisionType
from app.schemas.base import BaseEntitySchema, ORMModel, SoftDeleteSchema


class PolicyBase(ORMModel):
    organization_id: UUID
    name: str
    description: str | None = None
    rule_definition: dict[str, Any]
    enforcement_action: GovernanceDecisionType
    enabled: bool = True


class PolicyCreate(PolicyBase):
    pass


class PolicyManagementCreate(ORMModel):
    name: str
    description: str | None = None
    rule_definition: dict[str, Any]
    enforcement_action: GovernanceDecisionType
    enabled: bool = True

    @field_validator("rule_definition")
    @classmethod
    def _validate_rule_definition(cls, value: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(value, dict) or not value:
            raise ValueError("rule_definition must be a non-empty JSON object")
        return value


class PolicyUpdate(ORMModel):
    name: str | None = None
    description: str | None = None
    rule_definition: dict[str, Any] | None = None
    enforcement_action: GovernanceDecisionType | None = None
    enabled: bool | None = None


class PolicyResponse(PolicyBase, BaseEntitySchema, SoftDeleteSchema):
    pass

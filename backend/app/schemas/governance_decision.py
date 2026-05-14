from uuid import UUID

from pydantic import Field

from app.models.enums import GovernanceDecisionType
from app.schemas.base import BaseEntitySchema, ORMModel


class GovernanceDecisionBase(ORMModel):
    threat_event_id: UUID
    decision: GovernanceDecisionType
    reason: str | None = None
    risk_score: int = Field(ge=0, le=100)
    confidence_score: int = Field(ge=0, le=100)


class GovernanceDecisionCreate(GovernanceDecisionBase):
    pass


class GovernanceDecisionUpdate(ORMModel):
    decision: GovernanceDecisionType | None = None
    reason: str | None = None
    risk_score: int | None = Field(default=None, ge=0, le=100)
    confidence_score: int | None = Field(default=None, ge=0, le=100)


class GovernanceDecisionResponse(GovernanceDecisionBase, BaseEntitySchema):
    pass

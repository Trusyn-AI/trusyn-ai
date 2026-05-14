from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, validate_by_name=True, validate_by_alias=True)


class TimestampSchema(ORMModel):
    created_at: datetime
    updated_at: datetime


class BaseEntitySchema(TimestampSchema):
    id: UUID


class SoftDeleteSchema(ORMModel):
    is_deleted: bool
    deleted_at: datetime | None = None

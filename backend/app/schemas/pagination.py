from typing import Generic, TypeVar

from pydantic import Field

from app.schemas.base import ORMModel


T = TypeVar("T")


class PaginationQuery(ORMModel):
    limit: int = Field(default=20, ge=1, le=200)
    offset: int = Field(default=0, ge=0)
    sort_by: str = "created_at"
    sort_order: str = Field(default="desc", pattern="^(asc|desc|ASC|DESC)$")


class PaginatedResult(ORMModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int

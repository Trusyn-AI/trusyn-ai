from fastapi import Query

from app.schemas.pagination import PaginationQuery


async def pagination_params(
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc|ASC|DESC)$"),
) -> PaginationQuery:
    return PaginationQuery(limit=limit, offset=offset, sort_by=sort_by, sort_order=sort_order)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.repositories.base import BaseRepository


class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Organization)

    async def get_by_slug(self, slug: str) -> Organization | None:
        return await self.session.scalar(
            select(Organization).where(Organization.slug == slug, Organization.is_deleted.is_(False))
        )

    async def get_by_id_active(self, organization_id) -> Organization | None:
        return await self.session.scalar(
            select(Organization).where(
                Organization.id == organization_id,
                Organization.is_deleted.is_(False),
            )
        )

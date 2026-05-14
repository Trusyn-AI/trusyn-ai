from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.policy import Policy
from app.repositories.base import BaseRepository


class PolicyRepository(BaseRepository[Policy]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Policy)

    async def get_by_name_and_org(self, name: str, organization_id):
        return await self.session.scalar(
            select(Policy).where(
                Policy.name == name,
                Policy.organization_id == organization_id,
                Policy.is_deleted.is_(False),
            )
        )

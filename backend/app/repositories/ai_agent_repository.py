from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_agent import AIAgent
from app.repositories.base import BaseRepository


class AIAgentRepository(BaseRepository[AIAgent]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AIAgent)

    async def get_by_name_and_org(self, name: str, organization_id):
        return await self.session.scalar(
            select(AIAgent).where(
                AIAgent.name == name,
                AIAgent.organization_id == organization_id,
                AIAgent.is_deleted.is_(False),
            )
        )

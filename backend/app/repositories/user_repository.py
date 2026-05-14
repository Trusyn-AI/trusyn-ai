from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, User)

    async def get_by_email(self, email: str) -> User | None:
        return await self.session.scalar(select(User).where(User.email == email, User.is_deleted.is_(False)))

    async def get_active_by_id(self, user_id) -> User | None:
        return await self.session.scalar(
            select(User).where(
                User.id == user_id,
                User.is_deleted.is_(False),
            )
        )

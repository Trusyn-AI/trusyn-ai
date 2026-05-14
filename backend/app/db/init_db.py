"""Database bootstrap utilities for local setup and CI environments."""

import app.models  # noqa: F401
from app.core.logging import logger
from app.db.base import Base
from app.db.session import engine


async def init_db() -> None:
    """Initialize database schema.

    In production, schema changes should be managed via Alembic migrations.
    """

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialized")

from __future__ import annotations

import sys

from loguru import logger


def configure_logging(log_level: str, *, as_json: bool = False) -> None:
    """Configure centralized structured logging for API and workers."""
    logger.remove()
    logger.add(
        sys.stdout,
        level=log_level,
        enqueue=True,
        backtrace=False,
        diagnose=False,
        serialize=as_json,
        format=(
            "{time:YYYY-MM-DD HH:mm:ss.SSS} | "
            "{level: <8} | "
            "{name}:{function}:{line} | "
            "{message}"
        ),
    )


__all__ = ["logger", "configure_logging"]


from __future__ import annotations

import pytest

from app.middleware.rate_limit import InMemoryRateLimiter


@pytest.mark.asyncio
async def test_rate_limiter_blocks_when_limit_exceeded():
    limiter = InMemoryRateLimiter(window_seconds=60)
    allowed, _ = await limiter.hit("test-key", limit=2)
    assert allowed is True
    allowed, _ = await limiter.hit("test-key", limit=2)
    assert allowed is True
    allowed, retry_after = await limiter.hit("test-key", limit=2)
    assert allowed is False
    assert retry_after >= 1


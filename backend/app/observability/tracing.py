from __future__ import annotations

import uuid
from contextlib import asynccontextmanager, contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
from datetime import UTC, datetime
from time import perf_counter
from typing import Any

from loguru import logger


@dataclass(slots=True)
class TraceSpan:
    span_id: str
    name: str
    parent_span_id: str | None
    started_at: datetime
    ended_at: datetime | None = None
    duration_ms: float | None = None
    attributes: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class TraceContext:
    trace_id: str
    request_id: str | None = None
    organization_id: str | None = None
    agent_id: str | None = None
    actor_user_id: str | None = None
    started_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    active_span_ids: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "trace_id": self.trace_id,
            "request_id": self.request_id,
            "organization_id": self.organization_id,
            "agent_id": self.agent_id,
            "actor_user_id": self.actor_user_id,
            "started_at": self.started_at.isoformat(),
            "active_span_ids": list(self.active_span_ids),
        }


_trace_ctx_var: ContextVar[TraceContext | None] = ContextVar("trace_context", default=None)
_span_ctx_var: ContextVar[dict[str, TraceSpan]] = ContextVar("span_context", default={})


def new_trace_context(
    *,
    request_id: str | None = None,
    organization_id: str | None = None,
    agent_id: str | None = None,
    actor_user_id: str | None = None,
) -> TraceContext:
    return TraceContext(
        trace_id=str(uuid.uuid4()),
        request_id=request_id,
        organization_id=organization_id,
        agent_id=agent_id,
        actor_user_id=actor_user_id,
    )


def set_trace_context(context: TraceContext) -> None:
    _trace_ctx_var.set(context)


def get_trace_context() -> TraceContext | None:
    return _trace_ctx_var.get()


def clear_trace_context() -> None:
    _trace_ctx_var.set(None)
    _span_ctx_var.set({})


def current_span_id() -> str | None:
    context = get_trace_context()
    if not context or not context.active_span_ids:
        return None
    return context.active_span_ids[-1]


def _start_span(name: str, attributes: dict[str, Any] | None = None) -> tuple[TraceSpan, float]:
    context = get_trace_context()
    if context is None:
        context = new_trace_context()
        set_trace_context(context)

    parent_id = current_span_id()
    span_id = str(uuid.uuid4())
    span = TraceSpan(
        span_id=span_id,
        name=name,
        parent_span_id=parent_id,
        started_at=datetime.now(UTC),
        attributes=attributes or {},
    )

    spans = dict(_span_ctx_var.get())
    spans[span_id] = span
    _span_ctx_var.set(spans)
    context.active_span_ids.append(span_id)
    return span, perf_counter()


def _finish_span(span: TraceSpan, started_perf: float) -> None:
    context = get_trace_context()
    span.ended_at = datetime.now(UTC)
    span.duration_ms = round((perf_counter() - started_perf) * 1000, 3)
    if context and context.active_span_ids and context.active_span_ids[-1] == span.span_id:
        context.active_span_ids.pop()

    logger.debug(
        "trace_span_completed",
        trace_id=context.trace_id if context else None,
        request_id=context.request_id if context else None,
        span_id=span.span_id,
        parent_span_id=span.parent_span_id,
        span_name=span.name,
        duration_ms=span.duration_ms,
        attributes=span.attributes,
    )


@contextmanager
def start_span(name: str, attributes: dict[str, Any] | None = None):
    span, started_perf = _start_span(name, attributes)
    try:
        yield span
    finally:
        _finish_span(span, started_perf)


@asynccontextmanager
async def start_span_async(name: str, attributes: dict[str, Any] | None = None):
    span, started_perf = _start_span(name, attributes)
    try:
        yield span
    finally:
        _finish_span(span, started_perf)


def trace_lineage() -> dict[str, Any]:
    context = get_trace_context()
    spans = _span_ctx_var.get()
    return {
        "context": context.as_dict() if context else None,
        "spans": {span_id: span.__dict__ for span_id, span in spans.items()},
    }


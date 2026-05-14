from __future__ import annotations

import asyncio
import json
import uuid
from datetime import UTC, datetime
from json import JSONDecodeError
from typing import Any

from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketDisconnect

from app.core.config import settings
from app.events import stream_manager
from app.middleware.rate_limit import enforce_ws_rate_limit
from app.ws.channels import (
    GOVERNANCE_GLOBAL_CHANNEL,
    INTELLIGENCE_GLOBAL_CHANNEL,
    PLATFORM_GLOBAL_CHANNEL,
    THREATS_GLOBAL_CHANNEL,
    governance_channel_for_org,
    intelligence_channel_for_org,
    platform_channel_for_org,
    threat_channel_for_org,
)
from app.ws.connection import WSPrincipal, WebSocketAuthError, authenticate_websocket
from app.ws.manager import WebSocketConnection, ws_manager


router = APIRouter(tags=["realtime"])


def _parse_history_limit(message: dict[str, Any]) -> int:
    try:
        value = int(message.get("limit", 20))
    except (TypeError, ValueError):
        return 20
    return max(1, min(200, value))


def _client_ip(websocket: WebSocket) -> str:
    forwarded = websocket.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return websocket.client.host if websocket.client else "unknown"


async def _authenticate_and_rate_limit(websocket: WebSocket) -> WSPrincipal | None:
    try:
        principal = await authenticate_websocket(websocket)
    except WebSocketAuthError as exc:
        await websocket.close(code=4401, reason=str(exc))
        return None

    allowed, retry_after = await enforce_ws_rate_limit(_client_ip(websocket), str(principal.organization_id))
    if not allowed:
        await websocket.close(code=4429, reason=f"Rate limit exceeded. retry_after={retry_after}s")
        return None
    return principal


async def _read_json_message(connection: WebSocketConnection) -> dict[str, Any]:
    raw_text = await connection.websocket.receive_text()
    if len(raw_text.encode("utf-8")) > settings.ws_max_message_size:
        raise ValueError("Message exceeds max size")
    try:
        payload = json.loads(raw_text)
    except JSONDecodeError as exc:
        raise ValueError("Malformed JSON payload") from exc
    if not isinstance(payload, dict):
        raise ValueError("Payload must be a JSON object")
    return payload


async def _read_loop(connection: WebSocketConnection, allowed_channels: list[str]) -> None:
    websocket = connection.websocket
    try:
        while True:
            try:
                message = await asyncio.wait_for(_read_json_message(connection), timeout=settings.ws_idle_timeout_seconds)
            except TimeoutError:
                await ws_manager.send_json(connection, {"type": "error", "message": "Idle timeout exceeded"})
                await ws_manager.disconnect(connection.connection_id)
                break
            except ValueError as exc:
                await ws_manager.send_json(connection, {"type": "error", "message": str(exc)})
                continue

            await ws_manager.touch(connection.connection_id)
            message_type = str(message.get("type", "")).lower()

            if message_type == "ping":
                await ws_manager.send_json(connection, {"type": "pong", "timestamp": datetime.now(UTC).isoformat()})
                continue

            if message_type == "subscribe":
                channel = str(message.get("channel", ""))
                if channel not in allowed_channels:
                    await ws_manager.send_json(connection, {"type": "error", "message": "Channel not allowed"})
                    continue
                subscribed = await ws_manager.subscribe(connection.connection_id, channel)
                if not subscribed:
                    await ws_manager.send_json(connection, {"type": "error", "message": "Subscription limit reached"})
                    continue
                await ws_manager.send_json(connection, {"type": "subscribed", "channel": channel})
                continue

            if message_type == "unsubscribe":
                channel = str(message.get("channel", ""))
                await ws_manager.unsubscribe(connection.connection_id, channel)
                await ws_manager.send_json(connection, {"type": "unsubscribed", "channel": channel})
                continue

            if message_type == "history":
                limit = _parse_history_limit(message)
                channel = str(message.get("channel", ""))
                history = stream_manager.recent_for_channel(channel, limit=limit) if channel in allowed_channels else []
                await ws_manager.send_json(connection, {"type": "history", "channel": channel, "events": history})
                continue

            await ws_manager.send_json(connection, {"type": "error", "message": "Unsupported message type"})
    except WebSocketDisconnect:
        await ws_manager.disconnect(connection.connection_id)
    except RuntimeError:
        await ws_manager.disconnect(connection.connection_id)


async def _send_initial_history(connection: WebSocketConnection) -> None:
    for channel in sorted(connection.subscriptions):
        history = stream_manager.recent_for_channel(channel, limit=20)
        await ws_manager.send_json(connection, {"type": "history", "channel": channel, "events": history})


async def _handle_ws(websocket: WebSocket, channels: list[str], principal: WSPrincipal) -> None:
    try:
        connection = await ws_manager.connect(websocket, principal, initial_channels=channels)
    except RuntimeError:
        return
    await _send_initial_history(connection)
    await _read_loop(connection, channels)


@router.websocket("/ws/platform")
async def ws_platform(websocket: WebSocket) -> None:
    principal = await _authenticate_and_rate_limit(websocket)
    if principal is None:
        return
    channels = [PLATFORM_GLOBAL_CHANNEL] if principal.is_super_admin else [platform_channel_for_org(principal.organization_id)]
    await _handle_ws(websocket, channels, principal)


@router.websocket("/ws/organizations/{organization_id}")
async def ws_organization(websocket: WebSocket, organization_id: uuid.UUID) -> None:
    principal = await _authenticate_and_rate_limit(websocket)
    if principal is None:
        return
    if not principal.is_super_admin and principal.organization_id != organization_id:
        await websocket.close(code=4403, reason="Tenant access forbidden")
        return

    channels = [
        platform_channel_for_org(organization_id),
        threat_channel_for_org(organization_id),
        governance_channel_for_org(organization_id),
    ]
    await _handle_ws(websocket, channels, principal)


@router.websocket("/ws/threats")
async def ws_threats(websocket: WebSocket) -> None:
    principal = await _authenticate_and_rate_limit(websocket)
    if principal is None:
        return
    channels = [THREATS_GLOBAL_CHANNEL] if principal.is_super_admin else [threat_channel_for_org(principal.organization_id)]
    await _handle_ws(websocket, channels, principal)


@router.websocket("/ws/governance")
async def ws_governance(websocket: WebSocket) -> None:
    principal = await _authenticate_and_rate_limit(websocket)
    if principal is None:
        return
    channels = [GOVERNANCE_GLOBAL_CHANNEL] if principal.is_super_admin else [governance_channel_for_org(principal.organization_id)]
    await _handle_ws(websocket, channels, principal)


@router.websocket("/ws/intelligence")
async def ws_intelligence(websocket: WebSocket) -> None:
    principal = await _authenticate_and_rate_limit(websocket)
    if principal is None:
        return
    channels = [INTELLIGENCE_GLOBAL_CHANNEL] if principal.is_super_admin else [intelligence_channel_for_org(principal.organization_id)]
    await _handle_ws(websocket, channels, principal)


@router.get(f"{settings.api_v1_prefix}/ws/channels")
async def websocket_channel_reference() -> dict[str, Any]:
    """Reference endpoint for websocket channel discovery and docs."""
    return {
        "success": True,
        "data": {
            "paths": ["/ws/platform", "/ws/organizations/{organization_id}", "/ws/threats", "/ws/governance", "/ws/intelligence"],
            "auth": "Bearer access token via Authorization header or ?token= query string",
            "channels": {
                "platform_global": PLATFORM_GLOBAL_CHANNEL,
                "threats_global": THREATS_GLOBAL_CHANNEL,
                "governance_global": GOVERNANCE_GLOBAL_CHANNEL,
                "intelligence_global": INTELLIGENCE_GLOBAL_CHANNEL,
            },
            "max_message_size": settings.ws_max_message_size,
            "idle_timeout_seconds": settings.ws_idle_timeout_seconds,
        },
        "message": "WebSocket channels reference",
    }

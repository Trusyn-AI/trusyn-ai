from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import WebSocket
from loguru import logger
from starlette.websockets import WebSocketDisconnect

from app.core.config import settings
from app.events.event_models import PlatformEvent
from app.ws.channels import channels_for_event
from app.ws.connection import WSPrincipal


@dataclass(slots=True)
class WebSocketConnection:
    connection_id: str
    websocket: WebSocket
    principal: WSPrincipal
    subscriptions: set[str] = field(default_factory=set)
    connected_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    last_activity_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class WebSocketManager:
    """Manages connection lifecycle and org-aware event broadcasting."""

    def __init__(self) -> None:
        self._connections: dict[str, WebSocketConnection] = {}
        self._channel_members: dict[str, set[str]] = {}
        self._lock = asyncio.Lock()
        self._heartbeat_task: asyncio.Task[None] | None = None
        self._running = False

    @property
    def connection_count(self) -> int:
        return len(self._connections)

    @property
    def is_running(self) -> bool:
        return self._running

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._heartbeat_task = asyncio.create_task(self._heartbeat_loop(), name="ws-heartbeat")
        logger.info("ws_manager_started")

    async def stop(self) -> None:
        if not self._running:
            return
        self._running = False
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass

        async with self._lock:
            connections = list(self._connections.values())
            self._connections.clear()
            self._channel_members.clear()

        for connection in connections:
            await connection.websocket.close(code=1001, reason="Server shutdown")
        logger.info("ws_manager_stopped")

    async def connect(self, websocket: WebSocket, principal: WSPrincipal, initial_channels: list[str]) -> WebSocketConnection:
        async with self._lock:
            if len(self._connections) >= settings.ws_max_connections_global:
                await websocket.close(code=4429, reason="Global websocket limit reached")
                raise RuntimeError("ws_global_limit_exceeded")

            org_connections = sum(
                1 for connection in self._connections.values() if connection.principal.organization_id == principal.organization_id
            )
            if org_connections >= settings.ws_max_connections_per_org:
                await websocket.close(code=4429, reason="Organization websocket limit reached")
                raise RuntimeError("ws_org_limit_exceeded")

        await websocket.accept()
        connection = WebSocketConnection(connection_id=str(uuid.uuid4()), websocket=websocket, principal=principal)

        async with self._lock:
            self._connections[connection.connection_id] = connection
            for channel in initial_channels[: settings.ws_max_subscriptions_per_connection]:
                self._subscribe_locked(connection.connection_id, channel)

        await self.send_json(
            connection,
            {
                "type": "connection_ack",
                "connection_id": connection.connection_id,
                "organization_id": str(principal.organization_id),
                "role": principal.role.value,
                "subscribed_channels": sorted(connection.subscriptions),
                "timestamp": datetime.now(UTC).isoformat(),
            },
        )
        return connection

    async def disconnect(self, connection_id: str) -> None:
        async with self._lock:
            connection = self._connections.pop(connection_id, None)
            if connection is None:
                return
            for channel in list(connection.subscriptions):
                members = self._channel_members.get(channel)
                if members:
                    members.discard(connection_id)
                    if not members:
                        self._channel_members.pop(channel, None)
        logger.info("ws_disconnected", connection_id=connection_id)

    async def touch(self, connection_id: str) -> None:
        async with self._lock:
            connection = self._connections.get(connection_id)
            if connection:
                connection.last_activity_at = datetime.now(UTC)

    async def subscribe(self, connection_id: str, channel: str) -> bool:
        async with self._lock:
            connection = self._connections.get(connection_id)
            if connection is None:
                return False
            if len(connection.subscriptions) >= settings.ws_max_subscriptions_per_connection:
                return False
            self._subscribe_locked(connection_id, channel)
            connection.last_activity_at = datetime.now(UTC)
            return True

    async def unsubscribe(self, connection_id: str, channel: str) -> None:
        async with self._lock:
            connection = self._connections.get(connection_id)
            if connection is None:
                return
            connection.subscriptions.discard(channel)
            connection.last_activity_at = datetime.now(UTC)
            members = self._channel_members.get(channel)
            if members:
                members.discard(connection_id)
                if not members:
                    self._channel_members.pop(channel, None)

    async def broadcast_to_channel(self, channel: str, message: dict[str, Any]) -> None:
        async with self._lock:
            member_ids = list(self._channel_members.get(channel, set()))
            members = [self._connections.get(connection_id) for connection_id in member_ids]

        members = [member for member in members if member is not None]
        if not members:
            return

        batch_size = max(1, settings.ws_broadcast_batch_size)
        for idx in range(0, len(members), batch_size):
            batch = members[idx : idx + batch_size]
            await asyncio.gather(*(self.send_json(member, message) for member in batch), return_exceptions=True)

    async def publish_event(self, event: PlatformEvent) -> None:
        channels = channels_for_event(event)
        payload = {"type": "event", "data": event.model_dump(mode="json")}
        await asyncio.gather(
            *(self.broadcast_to_channel(channel, payload) for channel in channels),
            return_exceptions=True,
        )

    async def send_json(self, connection: WebSocketConnection, payload: dict[str, Any]) -> None:
        try:
            await connection.websocket.send_json(payload)
            await self.touch(connection.connection_id)
        except (RuntimeError, WebSocketDisconnect):
            await self.disconnect(connection.connection_id)

    async def cleanup_idle_connections(self) -> None:
        threshold = datetime.now(UTC) - timedelta(seconds=settings.ws_idle_timeout_seconds)
        async with self._lock:
            stale_ids = [
                connection_id
                for connection_id, connection in self._connections.items()
                if connection.last_activity_at <= threshold
            ]
        for connection_id in stale_ids:
            await self.disconnect(connection_id)

    def _subscribe_locked(self, connection_id: str, channel: str) -> None:
        connection = self._connections.get(connection_id)
        if connection is None:
            return
        connection.subscriptions.add(channel)
        if channel not in self._channel_members:
            self._channel_members[channel] = set()
        self._channel_members[channel].add(connection_id)

    async def _heartbeat_loop(self) -> None:
        while self._running:
            await asyncio.sleep(settings.ws_heartbeat_interval_seconds)
            await self.cleanup_idle_connections()
            async with self._lock:
                connections = list(self._connections.values())
            if not connections:
                continue
            heartbeat = {"type": "ping", "timestamp": datetime.now(UTC).isoformat()}
            await asyncio.gather(*(self.send_json(connection, heartbeat) for connection in connections), return_exceptions=True)


ws_manager = WebSocketManager()


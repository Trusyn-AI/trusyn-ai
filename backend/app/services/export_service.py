from __future__ import annotations

import csv
import json
from io import StringIO
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.enums import UserRole
from app.models.governance_decision import GovernanceDecision
from app.models.threat_event import ThreatEvent
from app.models.user import User


class ExportService:
    """Compliance-friendly structured exports for audit and governance history."""

    async def export_audit_logs(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        organization_id: UUID | None = None,
        as_csv: bool = False,
        limit: int = 5000,
    ) -> str:
        target_org_id = self._resolve_org_scope(current_user, organization_id)
        statement = (
            select(AuditLog)
            .where(AuditLog.organization_id == target_org_id)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
        )
        rows = (await session.scalars(statement)).all()

        records = [
            {
                "id": str(row.id),
                "organization_id": str(row.organization_id),
                "user_id": str(row.user_id) if row.user_id else None,
                "event_type": row.event_type,
                "severity": row.severity.value,
                "message": row.message,
                "metadata": row.metadata_json,
                "timestamp": row.timestamp.isoformat(),
            }
            for row in rows
        ]
        if as_csv:
            return _to_csv(records)
        return json.dumps(records, ensure_ascii=True)

    async def export_governance_decisions(
        self,
        session: AsyncSession,
        *,
        current_user: User,
        organization_id: UUID | None = None,
        as_csv: bool = False,
        limit: int = 5000,
    ) -> str:
        target_org_id = self._resolve_org_scope(current_user, organization_id)
        statement = (
            select(GovernanceDecision, ThreatEvent)
            .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
            .where(ThreatEvent.organization_id == target_org_id)
            .order_by(GovernanceDecision.created_at.desc())
            .limit(limit)
        )
        rows = (await session.execute(statement)).all()

        records = [
            {
                "governance_decision_id": str(decision.id),
                "threat_event_id": str(threat.id),
                "organization_id": str(threat.organization_id),
                "agent_id": str(threat.agent_id) if threat.agent_id else None,
                "decision": decision.decision.value,
                "reason": decision.reason,
                "risk_score": decision.risk_score,
                "confidence_score": decision.confidence_score,
                "threat_type": threat.threat_type,
                "threat_severity": threat.severity.value,
                "created_at": decision.created_at.isoformat(),
            }
            for decision, threat in rows
        ]
        if as_csv:
            return _to_csv(records)
        return json.dumps(records, ensure_ascii=True)

    def _resolve_org_scope(self, current_user: User, organization_id: UUID | None) -> UUID:
        if current_user.role == UserRole.SUPER_ADMIN and organization_id is not None:
            return organization_id
        return current_user.organization_id


def _to_csv(records: list[dict[str, Any]]) -> str:
    if not records:
        return ""
    buffer = StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(records[0].keys()))
    writer.writeheader()
    for record in records:
        writer.writerow(record)
    return buffer.getvalue()


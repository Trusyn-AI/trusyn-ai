from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime, timedelta
from math import ceil
from statistics import mean
from uuid import UUID

from sqlalchemy import Float, and_, asc, cast, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_agent import AIAgent
from app.models.audit_log import AuditLog
from app.models.enums import AgentStatus, GovernanceDecisionType, OrganizationStatus
from app.models.governance_decision import GovernanceDecision
from app.models.organization import Organization
from app.models.policy import Policy
from app.models.threat_event import ThreatEvent
from app.models.user import User
from app.schemas.admin import (
    AdminAPIRequestItem,
    AdminAPIMonitoringSummary,
    AdminDecisionDistributionPoint,
    AdminOrganizationItem,
    AdminPlatformKPI,
    AdminPlatformOverviewResponse,
    AdminRecentThreatItem,
    AdminRiskLeaderboardItem,
)
from app.schemas.pagination import PaginatedResult


class AdminService:
    async def list_organizations(
        self,
        session: AsyncSession,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
        status: OrganizationStatus | None = None,
        plan: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> PaginatedResult[AdminOrganizationItem]:
        now = datetime.now(UTC)
        since_24h = now - timedelta(hours=24)

        users_sq = (
            select(User.organization_id.label("org_id"), func.count(User.id).label("users_count"))
            .where(User.is_deleted.is_(False))
            .group_by(User.organization_id)
            .subquery()
        )
        agents_sq = (
            select(AIAgent.organization_id.label("org_id"), func.count(AIAgent.id).label("active_agents_count"))
            .where(AIAgent.is_deleted.is_(False), AIAgent.status == AgentStatus.OPERATIONAL)
            .group_by(AIAgent.organization_id)
            .subquery()
        )
        policies_sq = (
            select(Policy.organization_id.label("org_id"), func.count(Policy.id).label("policies_enabled_count"))
            .where(Policy.is_deleted.is_(False), Policy.enabled.is_(True))
            .group_by(Policy.organization_id)
            .subquery()
        )
        threats_sq = (
            select(ThreatEvent.organization_id.label("org_id"), func.count(ThreatEvent.id).label("threats_24h_count"))
            .where(ThreatEvent.detected_at >= since_24h)
            .group_by(ThreatEvent.organization_id)
            .subquery()
        )
        risk_sq = (
            select(
                ThreatEvent.organization_id.label("org_id"),
                func.avg(cast(GovernanceDecision.risk_score, Float)).label("avg_risk_24h"),
            )
            .join(GovernanceDecision, GovernanceDecision.threat_event_id == ThreatEvent.id)
            .where(GovernanceDecision.created_at >= since_24h)
            .group_by(ThreatEvent.organization_id)
            .subquery()
        )

        statement = (
            select(
                Organization,
                func.coalesce(users_sq.c.users_count, 0),
                func.coalesce(agents_sq.c.active_agents_count, 0),
                func.coalesce(policies_sq.c.policies_enabled_count, 0),
                func.coalesce(threats_sq.c.threats_24h_count, 0),
                func.coalesce(risk_sq.c.avg_risk_24h, 0.0),
            )
            .outerjoin(users_sq, users_sq.c.org_id == Organization.id)
            .outerjoin(agents_sq, agents_sq.c.org_id == Organization.id)
            .outerjoin(policies_sq, policies_sq.c.org_id == Organization.id)
            .outerjoin(threats_sq, threats_sq.c.org_id == Organization.id)
            .outerjoin(risk_sq, risk_sq.c.org_id == Organization.id)
            .where(Organization.is_deleted.is_(False))
        )

        if search:
            search_term = f"%{search.strip()}%"
            statement = statement.where(
                Organization.name.ilike(search_term) | Organization.slug.ilike(search_term),
            )
        if status:
            statement = statement.where(Organization.status == status)
        if plan:
            statement = statement.where(Organization.plan == plan)

        sort_map = {
            "name": Organization.name,
            "created_at": Organization.created_at,
            "status": Organization.status,
            "plan": Organization.plan,
        }
        sort_column = sort_map.get(sort_by, Organization.created_at)
        sorter = asc(sort_column) if sort_order.lower() == "asc" else desc(sort_column)

        total_stmt = select(func.count()).select_from(statement.subquery())
        total = int(await session.scalar(total_stmt) or 0)

        rows = (await session.execute(statement.order_by(sorter).offset(offset).limit(limit))).all()
        items = [
            AdminOrganizationItem(
                id=row[0].id,
                name=row[0].name,
                slug=row[0].slug,
                plan=row[0].plan,
                status=row[0].status,
                website=row[0].website,
                created_at=row[0].created_at,
                users_count=int(row[1] or 0),
                active_agents_count=int(row[2] or 0),
                policies_enabled_count=int(row[3] or 0),
                threats_24h_count=int(row[4] or 0),
                avg_risk_24h=round(float(row[5] or 0.0), 2),
            )
            for row in rows
        ]

        return PaginatedResult[AdminOrganizationItem](
            items=items,
            total=total,
            limit=limit,
            offset=offset,
        )

    async def platform_overview(self, session: AsyncSession) -> AdminPlatformOverviewResponse:
        now = datetime.now(UTC)
        since_24h = now - timedelta(hours=24)

        total_organizations = int(
            await session.scalar(select(func.count()).select_from(Organization).where(Organization.is_deleted.is_(False)))
            or 0
        )
        active_agents = int(
            await session.scalar(
                select(func.count()).select_from(AIAgent).where(
                    AIAgent.is_deleted.is_(False),
                    AIAgent.status == AgentStatus.OPERATIONAL,
                ),
            )
            or 0
        )
        threats_blocked_24h = int(
            await session.scalar(
                select(func.count())
                .select_from(GovernanceDecision)
                .where(
                    GovernanceDecision.created_at >= since_24h,
                    GovernanceDecision.decision.in_(
                        [
                            GovernanceDecisionType.BLOCK,
                            GovernanceDecisionType.QUARANTINE,
                            GovernanceDecisionType.RATE_LIMIT,
                        ],
                    ),
                ),
            )
            or 0
        )
        requests_processed_24h = int(
            await session.scalar(select(func.count()).select_from(GovernanceDecision).where(GovernanceDecision.created_at >= since_24h))
            or 0
        )
        avg_risk = float(
            await session.scalar(
                select(func.avg(cast(GovernanceDecision.risk_score, Float))).where(GovernanceDecision.created_at >= since_24h),
            )
            or 0.0
        )

        recent_rows = (
            await session.execute(
                select(ThreatEvent, Organization.name)
                .join(Organization, Organization.id == ThreatEvent.organization_id)
                .where(Organization.is_deleted.is_(False))
                .order_by(ThreatEvent.detected_at.desc())
                .limit(10),
            )
        ).all()
        recent_threats = [
            AdminRecentThreatItem(
                id=row[0].id,
                organization_id=row[0].organization_id,
                organization_name=row[1],
                threat_type=row[0].threat_type,
                severity=row[0].severity,
                title=row[0].title,
                detected_at=row[0].detected_at,
            )
            for row in recent_rows
        ]

        dist_rows = (
            await session.execute(
                select(GovernanceDecision.decision, func.count(GovernanceDecision.id))
                .where(GovernanceDecision.created_at >= since_24h)
                .group_by(GovernanceDecision.decision),
            )
        ).all()
        decision_distribution = [
            AdminDecisionDistributionPoint(decision=row[0], count=int(row[1] or 0))
            for row in dist_rows
        ]

        leaderboard_rows = (
            await session.execute(
                select(
                    Organization.id,
                    Organization.name,
                    func.avg(cast(GovernanceDecision.risk_score, Float)).label("avg_risk"),
                    func.count(ThreatEvent.id).label("threat_count"),
                )
                .join(ThreatEvent, ThreatEvent.organization_id == Organization.id)
                .join(GovernanceDecision, GovernanceDecision.threat_event_id == ThreatEvent.id)
                .where(
                    Organization.is_deleted.is_(False),
                    GovernanceDecision.created_at >= since_24h,
                )
                .group_by(Organization.id, Organization.name)
                .order_by(desc("avg_risk"))
                .limit(8),
            )
        ).all()
        risk_leaderboard = [
            AdminRiskLeaderboardItem(
                organization_id=row[0],
                organization_name=row[1],
                avg_risk_score=round(float(row[2] or 0.0), 2),
                threats_count_24h=int(row[3] or 0),
            )
            for row in leaderboard_rows
        ]

        return AdminPlatformOverviewResponse(
            kpis=AdminPlatformKPI(
                total_organizations=total_organizations,
                active_agents=active_agents,
                threats_blocked_24h=threats_blocked_24h,
                requests_processed_24h=requests_processed_24h,
                avg_risk_score_24h=round(avg_risk, 2),
            ),
            recent_threats=recent_threats,
            decision_distribution=decision_distribution,
            risk_leaderboard=risk_leaderboard,
        )

    async def api_monitoring_summary(self, session: AsyncSession) -> AdminAPIMonitoringSummary:
        now = datetime.now(UTC)
        since_24h = now - timedelta(hours=24)
        requests = await self._load_request_rows(session, since_24h=since_24h, limit=2000, offset=0)
        total_count = len(requests)
        duration_seconds = max((now - since_24h).total_seconds(), 1.0)
        rps = round(total_count / duration_seconds, 4)

        latencies = [item.latency_ms for item in requests]
        avg_latency = round(mean(latencies), 2) if latencies else 0.0
        p95_latency = 0.0
        if latencies:
            sorted_values = sorted(latencies)
            p95_index = min(len(sorted_values) - 1, max(0, ceil(len(sorted_values) * 0.95) - 1))
            p95_latency = float(sorted_values[p95_index])

        success_count = len([item for item in requests if item.status == "success"])
        blocked_count = len([item for item in requests if item.status == "blocked"])
        failed_count = len([item for item in requests if item.status == "failed"])

        model_usage: dict[str, int] = defaultdict(int)
        requests_by_hour: dict[str, int] = defaultdict(int)
        for item in requests:
            model_usage[item.model] += 1
            bucket = item.timestamp.strftime("%Y-%m-%d %H:00")
            requests_by_hour[bucket] += 1

        requests_by_hour_points = [
            {"bucket": bucket, "count": float(count)}
            for bucket, count in sorted(requests_by_hour.items())
        ]

        return AdminAPIMonitoringSummary(
            requests_per_second=rps,
            avg_latency_ms=avg_latency,
            p95_latency_ms=p95_latency,
            success_count=success_count,
            blocked_count=blocked_count,
            failed_count=failed_count,
            model_usage=dict(sorted(model_usage.items())),
            requests_by_hour=requests_by_hour_points,
        )

    async def api_monitoring_requests(
        self,
        session: AsyncSession,
        *,
        limit: int,
        offset: int,
        organization_id: UUID | None = None,
        model: str | None = None,
        status: str | None = None,
        start_at: datetime | None = None,
        end_at: datetime | None = None,
    ) -> PaginatedResult[AdminAPIRequestItem]:
        since_24h = start_at or (datetime.now(UTC) - timedelta(hours=24))
        rows = await self._load_request_rows(
            session,
            since_24h=since_24h,
            limit=max(limit + offset, 500),
            offset=0,
            until=end_at,
        )

        filtered = []
        for item in rows:
            if organization_id and item.organization_id != organization_id:
                continue
            if model and item.model != model:
                continue
            if status and item.status != status:
                continue
            filtered.append(item)

        total = len(filtered)
        paged = filtered[offset : offset + limit]
        return PaginatedResult[AdminAPIRequestItem](items=paged, total=total, limit=limit, offset=offset)

    async def _load_request_rows(
        self,
        session: AsyncSession,
        *,
        since_24h: datetime,
        limit: int,
        offset: int,
        until: datetime | None = None,
    ) -> list[AdminAPIRequestItem]:
        filters = [GovernanceDecision.created_at >= since_24h]
        if until:
            filters.append(GovernanceDecision.created_at <= until)

        rows = (
            await session.execute(
                select(
                    GovernanceDecision.id,
                    GovernanceDecision.created_at,
                    GovernanceDecision.decision,
                    GovernanceDecision.risk_score,
                    ThreatEvent.organization_id,
                    Organization.name,
                    ThreatEvent.agent_id,
                    AIAgent.name,
                )
                .join(ThreatEvent, ThreatEvent.id == GovernanceDecision.threat_event_id)
                .join(Organization, Organization.id == ThreatEvent.organization_id)
                .outerjoin(AIAgent, AIAgent.id == ThreatEvent.agent_id)
                .where(and_(*filters))
                .order_by(GovernanceDecision.created_at.desc())
                .offset(offset)
                .limit(limit),
            )
        ).all()

        def decision_to_status(decision: GovernanceDecisionType) -> str:
            if decision == GovernanceDecisionType.ALLOW:
                return "success"
            if decision in {GovernanceDecisionType.BLOCK, GovernanceDecisionType.QUARANTINE, GovernanceDecisionType.RATE_LIMIT}:
                return "blocked"
            return "failed"

        def decision_to_latency(risk_score: int) -> int:
            # deterministic synthetic latency derived from risk score to avoid random demo values
            return max(35, min(400, 70 + int((risk_score or 0) * 2.2)))

        def decision_to_model(decision: GovernanceDecisionType) -> str:
            if decision in {GovernanceDecisionType.BLOCK, GovernanceDecisionType.QUARANTINE}:
                return "gemini"
            if decision == GovernanceDecisionType.RATE_LIMIT:
                return "openai"
            return "anthropic"

        return [
            AdminAPIRequestItem(
                id=str(row[0]),
                timestamp=row[1],
                organization_id=row[4],
                organization_name=row[5],
                agent_id=row[6],
                agent_name=row[7],
                endpoint="/api/v1/gateway/request",
                status=decision_to_status(row[2]),
                latency_ms=decision_to_latency(int(row[3] or 0)),
                model=decision_to_model(row[2]),
                risk_score=int(row[3] or 0),
            )
            for row in rows
        ]


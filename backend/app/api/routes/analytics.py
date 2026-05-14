from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_role
from app.api.deps.db import get_db_session
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsAgentTrustTrendsResponse,
    AnalyticsDecisionDistributionResponse,
    AnalyticsOverviewResponse,
    AnalyticsPolicyImpactResponse,
    AnalyticsQuery,
    AnalyticsRiskTrendsResponse,
)
from app.schemas.common import SuccessResponse
from app.services.analytics_service import AnalyticsService


router = APIRouter(prefix="/analytics", tags=["analytics"])
analytics_service = AnalyticsService()


def _analytics_query(
    start_at: datetime | None = None,
    end_at: datetime | None = None,
    granularity: str = Query("day", pattern="^(hour|day|week)$"),
    agent_id: UUID | None = None,
    policy_id: UUID | None = None,
    organization_id: UUID | None = None,
) -> AnalyticsQuery:
    return AnalyticsQuery(
        start_at=start_at,
        end_at=end_at,
        granularity=granularity,
        agent_id=agent_id,
        policy_id=policy_id,
        organization_id=organization_id,
    )


@router.get("/overview", response_model=SuccessResponse[AnalyticsOverviewResponse])
async def analytics_overview(
    current_user: Annotated[User, Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ANALYST]))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[AnalyticsQuery, Depends(_analytics_query)],
) -> SuccessResponse[AnalyticsOverviewResponse]:
    data = await analytics_service.overview(session, current_user=current_user, query=query)
    return SuccessResponse(data=data, message="Analytics overview fetched")


@router.get("/risk-trends", response_model=SuccessResponse[AnalyticsRiskTrendsResponse])
async def analytics_risk_trends(
    current_user: Annotated[User, Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ANALYST]))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[AnalyticsQuery, Depends(_analytics_query)],
) -> SuccessResponse[AnalyticsRiskTrendsResponse]:
    data = await analytics_service.risk_trends(session, current_user=current_user, query=query)
    return SuccessResponse(data=data, message="Analytics risk trends fetched")


@router.get("/decision-distribution", response_model=SuccessResponse[AnalyticsDecisionDistributionResponse])
async def analytics_decision_distribution(
    current_user: Annotated[User, Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ANALYST]))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[AnalyticsQuery, Depends(_analytics_query)],
) -> SuccessResponse[AnalyticsDecisionDistributionResponse]:
    data = await analytics_service.decision_distribution(session, current_user=current_user, query=query)
    return SuccessResponse(data=data, message="Analytics decision distribution fetched")


@router.get("/agent-trust-trends", response_model=SuccessResponse[AnalyticsAgentTrustTrendsResponse])
async def analytics_agent_trust_trends(
    current_user: Annotated[User, Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ANALYST]))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[AnalyticsQuery, Depends(_analytics_query)],
) -> SuccessResponse[AnalyticsAgentTrustTrendsResponse]:
    data = await analytics_service.agent_trust_trends(session, current_user=current_user, query=query)
    return SuccessResponse(data=data, message="Analytics agent trust trends fetched")


@router.get("/policy-impact", response_model=SuccessResponse[AnalyticsPolicyImpactResponse])
async def analytics_policy_impact(
    current_user: Annotated[User, Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ANALYST]))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[AnalyticsQuery, Depends(_analytics_query)],
) -> SuccessResponse[AnalyticsPolicyImpactResponse]:
    data = await analytics_service.policy_impact(session, current_user=current_user, query=query)
    return SuccessResponse(data=data, message="Analytics policy impact fetched")

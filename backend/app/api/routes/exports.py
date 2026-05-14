from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps.auth import require_role
from app.api.deps.db import get_db_session
from app.models.enums import UserRole
from app.models.user import User
from app.services.export_service import ExportService


router = APIRouter(prefix="/exports", tags=["exports"])
export_service = ExportService()


@router.get("/audit")
async def export_audit_logs(
    current_user: Annotated[User, Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    format: str = Query("json", pattern="^(json|csv)$"),
    organization_id: UUID | None = None,
    limit: int = Query(5000, ge=1, le=20000),
) -> Response:
    as_csv = format.lower() == "csv"
    payload = await export_service.export_audit_logs(
        session,
        current_user=current_user,
        organization_id=organization_id,
        as_csv=as_csv,
        limit=limit,
    )
    media = "text/csv" if as_csv else "application/json"
    filename = "audit_logs.csv" if as_csv else "audit_logs.json"
    return Response(content=payload, media_type=media, headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.get("/governance-decisions")
async def export_governance_decisions(
    current_user: Annotated[User, Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    format: str = Query("json", pattern="^(json|csv)$"),
    organization_id: UUID | None = None,
    limit: int = Query(5000, ge=1, le=20000),
) -> Response:
    as_csv = format.lower() == "csv"
    payload = await export_service.export_governance_decisions(
        session,
        current_user=current_user,
        organization_id=organization_id,
        as_csv=as_csv,
        limit=limit,
    )
    media = "text/csv" if as_csv else "application/json"
    filename = "governance_decisions.csv" if as_csv else "governance_decisions.json"
    return Response(content=payload, media_type=media, headers={"Content-Disposition": f"attachment; filename={filename}"})


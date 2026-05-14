from fastapi import APIRouter

from app.api.routes.ai_agents import router as ai_agents_router
from app.api.routes.admin import router as admin_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.api_keys import router as api_keys_router
from app.api.routes.audit_logs import router as audit_logs_router
from app.api.routes.auth import router as auth_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.exports import router as exports_router
from app.api.routes.gateway import router as gateway_router
from app.api.routes.health import router as health_router
from app.api.routes.intelligence import router as intelligence_router
from app.api.routes.integrations import router as integrations_router
from app.api.routes.organizations import router as organizations_router
from app.api.routes.policies import router as policies_router
from app.api.routes.system import router as system_router
from app.api.routes.threats import router as threats_router
from app.api.routes.users import router as users_router
from app.api.routes.ws import router as ws_router
from app.core.config import settings


api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(ws_router)

v1_router = APIRouter(prefix=settings.api_v1_prefix)
v1_router.include_router(system_router)
v1_router.include_router(admin_router)
v1_router.include_router(auth_router)
v1_router.include_router(exports_router)
v1_router.include_router(intelligence_router)
v1_router.include_router(audit_logs_router)
v1_router.include_router(dashboard_router)
v1_router.include_router(analytics_router)
v1_router.include_router(users_router)
v1_router.include_router(organizations_router)
v1_router.include_router(integrations_router)
v1_router.include_router(api_keys_router)
v1_router.include_router(ai_agents_router)
v1_router.include_router(policies_router)
v1_router.include_router(threats_router)
v1_router.include_router(gateway_router)

api_router.include_router(v1_router)

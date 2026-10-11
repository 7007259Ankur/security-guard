from fastapi import APIRouter
from app.api.routes import auth, dashboard, credentials, files, calendar, audit_logs

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(credentials.router, prefix="/credentials", tags=["credentials"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])

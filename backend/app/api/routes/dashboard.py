from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User
from app.models.credential import Credential
from app.models.file_item import FileItem
from app.models.calendar_event import CalendarEvent
from app.models.audit_log import AuditLog
from app.schemas.dashboard import DashboardStats, ActivityItem
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vault_count = db.query(Credential).filter(Credential.user_id == current_user.id).count()
    file_count = db.query(FileItem).filter(FileItem.user_id == current_user.id).count()
    event_count = db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id).count()
    
    storage_sum = (
        db.query(func.coalesce(func.sum(FileItem.file_size), 0))
        .filter(FileItem.user_id == current_user.id)
        .scalar()
    )
    storage_used_bytes = int(storage_sum or 0)

    # Dynamic security score calculation (70 base, +5 per credential up to 20, +10 for active account)
    security_score = min(100, 75 + min(20, vault_count * 4) + (5 if file_count > 0 else 0))

    audit_logs = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
        .all()
    )

    activities = [
        ActivityItem(
            id=log.id,
            action=log.action,
            description=log.details,
            timestamp=log.created_at,
        )
        for log in audit_logs
    ]

    return DashboardStats(
        vault_count=vault_count,
        file_count=file_count,
        event_count=event_count,
        storage_used_bytes=storage_used_bytes,
        security_score=security_score,
        recent_activities=activities,
    )

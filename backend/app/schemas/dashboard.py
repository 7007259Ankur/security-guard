from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class ActivityItem(BaseModel):
    id: str
    action: str
    description: Optional[str] = None
    timestamp: datetime


class DashboardStats(BaseModel):
    vault_count: int
    file_count: int
    event_count: int
    storage_used_bytes: int
    security_score: int
    recent_activities: List[ActivityItem]

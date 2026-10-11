from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class FileItemRead(BaseModel):
    id: str
    filename: str
    file_size: int
    content_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

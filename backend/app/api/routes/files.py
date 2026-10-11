import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.file_item import FileItem
from app.models.audit_log import AuditLog
from app.schemas.file_item import FileItemRead
from app.api.deps import get_current_user

router = APIRouter()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=List[FileItemRead])
def list_files(
    search: Optional[str] = Query(None, description="Search by filename"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(FileItem).filter(FileItem.user_id == current_user.id)
    if search:
        query = query.filter(FileItem.filename.ilike(f"%{search}%"))
    files = query.order_by(FileItem.created_at.desc()).offset(skip).limit(limit).all()
    return files


@router.post("/upload", response_model=FileItemRead, status_code=status.HTTP_201_CREATED)
def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stored_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)

    # Save to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    file_item = FileItem(
        user_id=current_user.id,
        filename=file.filename,
        stored_filename=stored_name,
        file_size=file_size,
        content_type=file.content_type,
    )
    db.add(file_item)
    db.commit()
    db.refresh(file_item)

    client_ip = request.client.host if request.client else "unknown"
    log = AuditLog(
        user_id=current_user.id,
        action="FILE_UPLOADED",
        details=f"Uploaded file '{file.filename}' ({file_size} bytes)",
        ip_address=client_ip,
    )
    db.add(log)
    db.commit()

    return file_item


@router.get("/{id}/download")
def download_file(
    id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_item = db.query(FileItem).filter(
        FileItem.id == id, FileItem.user_id == current_user.id
    ).first()
    if not file_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or access denied",
        )

    file_path = os.path.join(settings.UPLOAD_DIR, file_item.stored_filename)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage",
        )

    client_ip = request.client.host if request.client else "unknown"
    log = AuditLog(
        user_id=current_user.id,
        action="FILE_DOWNLOADED",
        details=f"Downloaded file '{file_item.filename}'",
        ip_address=client_ip,
    )
    db.add(log)
    db.commit()

    return FileResponse(
        path=file_path,
        filename=file_item.filename,
        media_type=file_item.content_type or "application/octet-stream",
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_item = db.query(FileItem).filter(
        FileItem.id == id, FileItem.user_id == current_user.id
    ).first()
    if not file_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or access denied",
        )

    filename = file_item.filename
    file_path = os.path.join(settings.UPLOAD_DIR, file_item.stored_filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

    db.delete(file_item)
    db.commit()

    client_ip = request.client.host if request.client else "unknown"
    log = AuditLog(
        user_id=current_user.id,
        action="FILE_DELETED",
        details=f"Deleted file '{filename}'",
        ip_address=client_ip,
    )
    db.add(log)
    db.commit()

    return None

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.credential import Credential
from app.models.audit_log import AuditLog
from app.schemas.credential import (
    CredentialCreate,
    CredentialUpdate,
    CredentialListItem,
    CredentialDetail,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[CredentialListItem])
def list_credentials(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in title or username"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Credential).filter(Credential.user_id == current_user.id)
    if category:
        query = query.filter(Credential.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(
            (Credential.title.ilike(f"%{search}%")) | (Credential.username.ilike(f"%{search}%"))
        )
    items = query.order_by(Credential.created_at.desc()).offset(skip).limit(limit).all()
    return items


@router.post("", response_model=CredentialDetail, status_code=status.HTTP_201_CREATED)
def create_credential(
    cred_in: CredentialCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cred = Credential(
        user_id=current_user.id,
        title=cred_in.title,
        category=cred_in.category,
        username=cred_in.username,
        website_url=cred_in.website_url,
        encrypted_data=cred_in.encrypted_data,
        encryption_iv=cred_in.encryption_iv,
        key_derivation_salt=cred_in.key_derivation_salt,
    )
    db.add(cred)
    db.commit()
    db.refresh(cred)

    client_ip = request.client.host if request.client else "unknown"
    log = AuditLog(
        user_id=current_user.id,
        action="CREDENTIAL_CREATED",
        details=f"Created credential '{cred.title}'",
        ip_address=client_ip,
    )
    db.add(log)
    db.commit()

    return cred


@router.get("/{id}", response_model=CredentialDetail)
def get_credential(
    id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cred = db.query(Credential).filter(
        Credential.id == id, Credential.user_id == current_user.id
    ).first()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found or access denied",
        )

    client_ip = request.client.host if request.client else "unknown"
    log = AuditLog(
        user_id=current_user.id,
        action="CREDENTIAL_ACCESSED",
        details=f"Accessed credential '{cred.title}'",
        ip_address=client_ip,
    )
    db.add(log)
    db.commit()

    return cred


@router.put("/{id}", response_model=CredentialDetail)
def update_credential(
    id: str,
    cred_in: CredentialUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cred = db.query(Credential).filter(
        Credential.id == id, Credential.user_id == current_user.id
    ).first()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found or access denied",
        )

    update_data = cred_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(cred, field, val)

    db.add(cred)
    db.commit()
    db.refresh(cred)

    client_ip = request.client.host if request.client else "unknown"
    log = AuditLog(
        user_id=current_user.id,
        action="CREDENTIAL_UPDATED",
        details=f"Updated credential '{cred.title}'",
        ip_address=client_ip,
    )
    db.add(log)
    db.commit()

    return cred


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credential(
    id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cred = db.query(Credential).filter(
        Credential.id == id, Credential.user_id == current_user.id
    ).first()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found or access denied",
        )

    title = cred.title
    db.delete(cred)
    db.commit()

    client_ip = request.client.host if request.client else "unknown"
    log = AuditLog(
        user_id=current_user.id,
        action="CREDENTIAL_DELETED",
        details=f"Deleted credential '{title}'",
        ip_address=client_ip,
    )
    db.add(log)
    db.commit()

    return None

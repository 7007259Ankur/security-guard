from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CredentialBase(BaseModel):
    title: str
    category: Optional[str] = "General"
    username: Optional[str] = None
    website_url: Optional[str] = None


class CredentialCreate(CredentialBase):
    encrypted_data: str
    encryption_iv: str
    key_derivation_salt: str


class CredentialUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    username: Optional[str] = None
    website_url: Optional[str] = None
    encrypted_data: Optional[str] = None
    encryption_iv: Optional[str] = None
    key_derivation_salt: Optional[str] = None


class CredentialListItem(CredentialBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CredentialDetail(CredentialBase):
    id: str
    encrypted_data: str
    encryption_iv: str
    key_derivation_salt: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

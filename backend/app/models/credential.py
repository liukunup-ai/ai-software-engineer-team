import uuid
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel
from typing import Optional
from .user import User


class CredentialBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    username: str = Field(max_length=255)
    password: str = Field(max_length=255)
    service: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)


class CredentialCreate(CredentialBase):
    pass


class CredentialUpdate(SQLModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    username: Optional[str] = Field(default=None, max_length=255)
    password: Optional[str] = Field(default=None, max_length=255)
    service: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)


class Credential(CredentialBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="credentials")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CredentialPublic(CredentialBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class CredentialsPublic(SQLModel):
    data: list[CredentialPublic]
    count: int
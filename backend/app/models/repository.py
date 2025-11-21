import uuid
from typing import TYPE_CHECKING, Optional
from datetime import datetime
from typing import Optional
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User


class RepositoryBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    url: str = Field(max_length=500)
    description: Optional[str] = Field(default=None, max_length=500)
    is_public: bool = Field(default=False)


class RepositoryCreate(RepositoryBase):
    pass


class RepositoryUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    url: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None, max_length=500)
    is_public: Optional[bool] = None


class Repository(RepositoryBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: Optional["User"] = Relationship(back_populates="repositories")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RepositoryPublic(RepositoryBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class RepositoriesPublic(SQLModel):
    data: list[RepositoryPublic]
    count: int
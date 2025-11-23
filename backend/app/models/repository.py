import uuid

from typing import TYPE_CHECKING, Optional, List
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel

from .common import ProjectRepositoryLink

if TYPE_CHECKING:
    from .user import User
    from .project import Project


class RepositoryBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    url: str = Field(min_length=1, max_length=1023)
    description: Optional[str] = Field(default=None, max_length=500)


class RepositoryCreate(RepositoryBase):
    pass


class RepositoryUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    url: Optional[str] = Field(default=None, max_length=1023)
    description: Optional[str] = Field(default=None, max_length=500)


class Repository(RepositoryBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: Optional["User"] = Relationship(back_populates="repositories")

    projects: List["Project"] = Relationship(back_populates="repositories", link_model=ProjectRepositoryLink)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = Field(default=None, index=True)


class RepositoryPublic(RepositoryBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class RepositoriesPublic(SQLModel):
    data: list[RepositoryPublic]
    count: int

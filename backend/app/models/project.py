import uuid
from typing import TYPE_CHECKING, Optional
from datetime import datetime
from typing import List, Optional

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .user import User


class ProjectBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    is_active: bool = Field(default=True)


class ProjectCreate(ProjectBase):
    repository_urls: Optional[List[str]] = None


class ProjectUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    is_active: Optional[bool] = None
    repository_urls: Optional[List[str]] = None


class Project(ProjectBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: Optional["User"] = Relationship(back_populates="projects")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProjectPublic(ProjectBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ProjectsPublic(SQLModel):
    data: list[ProjectPublic]
    count: int
import uuid

from datetime import datetime
from typing import TYPE_CHECKING, Optional, List
from sqlmodel import Field, Relationship, SQLModel

from .common import ProjectMemberLink, ProjectIssueLink, ProjectRepositoryLink, ProjectNodeLink
if TYPE_CHECKING:
    from .user import User
    from .issue import Issue
    from .repository import Repository
    from .node import Node


class ProjectBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=999)


class ProjectCreate(ProjectBase):
    member_ids: List[uuid.UUID] = Field(default_factory=list)
    repository_ids: List[uuid.UUID] = Field(default_factory=list)
    node_ids: List[uuid.UUID] = Field(default_factory=list)
    repository_urls: Optional[List[str]] = None


class ProjectUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=999)
    member_ids: Optional[List[uuid.UUID]] = None
    repository_ids: Optional[List[uuid.UUID]] = None
    node_ids: Optional[List[uuid.UUID]] = None
    repository_urls: Optional[List[str]] = None


class Project(ProjectBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: Optional["User"] = Relationship(
        back_populates="projects",
        sa_relationship_kwargs={"overlaps": "project_members"},
    )

    members: List["User"] = Relationship(back_populates="project_members", link_model=ProjectMemberLink)
    issues: List["Issue"] = Relationship(back_populates="projects", link_model=ProjectIssueLink)
    repositories: List["Repository"] = Relationship(back_populates="projects", link_model=ProjectRepositoryLink)
    nodes: List["Node"] = Relationship(back_populates="projects", link_model=ProjectNodeLink)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = Field(default=None, index=True)


class ProjectPublic(ProjectBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ProjectsPublic(SQLModel):
    data: List[ProjectPublic]
    count: int

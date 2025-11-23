import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional, List

from sqlmodel import Field, Relationship, SQLModel

from .common import ProjectIssueLink

if TYPE_CHECKING:
    from .user import User
    from .project import Project
    from .task import Task


class IssueBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    content: str | None = Field(default=None, max_length=2048)
    repository_url: str | None = Field(default=None, max_length=512)
    issue_number: int | None = None
    priority: int = Field(default=0)  # 优先级，数字越大越优先
    status: str = Field(default="pending", max_length=32)  # pending/processing/pending_merge/merged/terminated
    project_id: uuid.UUID | None = Field(default=None)


class IssueDependencyLink(SQLModel, table=True):
    __tablename__ = "issue_dependency_link"
    issue_id: uuid.UUID = Field(foreign_key="issue.id", primary_key=True, ondelete="CASCADE")
    depends_on_issue_id: uuid.UUID = Field(
        foreign_key="issue.id",
        primary_key=True,
        ondelete="CASCADE",
    )


class IssueCreate(IssueBase):
    dependency_issue_ids: List[uuid.UUID] = Field(default_factory=list)


class IssueUpdate(SQLModel):
    title: Optional[str] = Field(default=None, max_length=255)
    content: Optional[str] = Field(default=None, max_length=2048)
    repository_url: Optional[str] = Field(default=None, max_length=512)
    issue_number: Optional[int] = Field(default=None)
    priority: Optional[int] = Field(default=None)
    status: Optional[str] = Field(default=None, max_length=32)
    project_id: Optional[uuid.UUID] = None
    dependency_issue_ids: Optional[List[uuid.UUID]] = None


class Issue(IssueBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: Optional["User"] = Relationship(back_populates="issues")

    project_id: uuid.UUID | None = Field(foreign_key="project.id", default=None, ondelete="SET NULL")
    project: Optional["Project"] = Relationship()
    projects: List["Project"] = Relationship(back_populates="issues", link_model=ProjectIssueLink)
    tasks: list["Task"] = Relationship(back_populates="issue")

    assigned_node_id: uuid.UUID | None = Field(foreign_key="node.id", default=None, ondelete="SET NULL")
    started_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)
    error_message: str | None = Field(default=None, max_length=1024)
    result_branch: str | None = Field(default=None, max_length=255)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = Field(default=None, index=True)


class IssuePublic(IssueBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None
    result_branch: str | None = None
    assigned_node_id: uuid.UUID | None = None
    dependency_issue_ids: list[uuid.UUID] = Field(default_factory=list)


class IssuesPublic(SQLModel):
    data: list[IssuePublic]
    count: int

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional, List

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User
    from .project import Project
    from .task import Task


class IssueBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    content: str | None = Field(default=None, max_length=2048)
    priority: int = Field(default=0)  # 优先级，数字越大越优先
    status: str = Field(default="pending", max_length=32)  # pending/processing/pending_merge/merged/terminated
    dependency_issue_ids: List[uuid.UUID] = Field(default_factory=list)


class IssueDependencyLink(SQLModel, table=True):
    issue_id: uuid.UUID = Field(foreign_key="issue.id", primary_key=True, ondelete="CASCADE")
    depends_on_issue_id: uuid.UUID = Field(
        foreign_key="issue.id",
        primary_key=True,
        ondelete="CASCADE",
    )


class IssueCreate(IssueBase):
    pass


class IssueUpdate(SQLModel):
    title: Optional[str] = Field(default=None, max_length=255)
    content: Optional[str] = Field(default=None, max_length=2048)
    priority: Optional[int] = Field(default=None)
    status: Optional[str] = Field(default=None, max_length=32)
    dependency_issue_ids: Optional[List[uuid.UUID]] = None


class Issue(IssueBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: Optional["User"] = Relationship(back_populates="issues")

    project: Optional["Project"] = Relationship(back_populates="issues")
    tasks: list["Task"] = Relationship(back_populates="issue")

    started_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)

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
    dependency_issue_ids: list[uuid.UUID] = Field(default_factory=list)


class IssuesPublic(SQLModel):
    data: list[IssuePublic]
    count: int

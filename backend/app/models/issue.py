import uuid
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel
from .user import User


class IssueBase(SQLModel):
    """Issue基础模型"""
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2048)
    repository_url: str | None = Field(default=None, max_length=512)
    issue_number: int | None = Field(default=None)
    status: str = Field(default="pending", max_length=32)  # pending/processing/completed/failed
    priority: int = Field(default=0)  # 优先级，数字越大越优先
    assigned_node_id: uuid.UUID | None = Field(default=None)  # 分配给哪个节点


class IssueCreate(IssueBase):
    pass


class IssueUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2048)
    repository_url: str | None = Field(default=None, max_length=512)
    issue_number: int | None = Field(default=None)
    status: str | None = Field(default=None, max_length=32)
    priority: int | None = Field(default=None)
    assigned_node_id: uuid.UUID | None = Field(default=None)


class Issue(IssueBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="issues")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)
    error_message: str | None = Field(default=None, max_length=1024)
    result_branch: str | None = Field(default=None, max_length=255)  # 处理结果的分支名


class IssuePublic(IssueBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None
    result_branch: str | None = None


class IssuesPublic(SQLModel):
    data: list[IssuePublic]
    count: int

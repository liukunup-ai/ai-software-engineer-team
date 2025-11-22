import uuid
from typing import TYPE_CHECKING, Optional
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User
    from .issue import Issue
    from .node import Node


class TaskBase(SQLModel):
    """任务基础模型 - 用于记录Issue的自动化处理任务"""
    issue_id: uuid.UUID = Field(foreign_key="issue.id", nullable=False)
    node_id: uuid.UUID | None = Field(default=None, foreign_key="node.id")
    status: str = Field(default="pending", max_length=32)  # pending/running/success/failed
    command: str | None = Field(default=None, max_length=512)  # 下发给node的命令
    result_branch: str | None = Field(default=None, max_length=255)  # 处理结果的分支名
    error_message: str | None = Field(default=None, max_length=2048)


class TaskCreate(TaskBase):
    pass


class TaskUpdate(SQLModel):
    node_id: uuid.UUID | None = Field(default=None)
    status: str | None = Field(default=None, max_length=32)
    command: str | None = Field(default=None, max_length=512)
    result_branch: str | None = Field(default=None, max_length=255)
    error_message: str | None = Field(default=None, max_length=2048)


class Task(TaskBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: Optional["User"] = Relationship(back_populates="tasks")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)


class TaskPublic(TaskBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None


class TasksPublic(SQLModel):
    data: list[TaskPublic]
    count: int

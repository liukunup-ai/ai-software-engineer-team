import uuid
from datetime import datetime
from sqlmodel import Field, SQLModel


class WorkflowLogBase(SQLModel):
    """工作流执行日志基础模型"""
    issue_id: uuid.UUID = Field(foreign_key="issue.id")
    node_id: uuid.UUID | None = Field(default=None, foreign_key="node.id")
    step_name: str = Field(max_length=100)  # init/clone/ai_coding/commit/push
    status: str = Field(max_length=32)  # running/success/failed
    command: str | None = Field(default=None, max_length=512)
    output: str | None = Field(default=None, max_length=4096)
    error_message: str | None = Field(default=None, max_length=2048)
    duration_ms: int | None = Field(default=None)


class WorkflowLog(WorkflowLogBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WorkflowLogPublic(WorkflowLogBase):
    id: uuid.UUID
    created_at: datetime


class WorkflowLogsPublic(SQLModel):
    data: list[WorkflowLogPublic]
    count: int

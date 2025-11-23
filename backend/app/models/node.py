import uuid

from typing import TYPE_CHECKING, Optional, List
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel

from .common import NodeCredentialLink
if TYPE_CHECKING:
    from .user import User
    from .credential import Credential


class NodeBase(SQLModel):
    name: str = Field(index=True, max_length=255)
    ip: str = Field(max_length=64)
    description: str | None = Field(default=None, max_length=255)
    tags: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default="offline", max_length=32)  # offline/online/error
    is_public: bool = Field(default=True)
    is_disabled: bool = Field(default=False)


class NodeCreate(NodeBase):
    pass


class NodeUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    ip: str | None = Field(default=None, max_length=64)
    description: str | None = Field(default=None, max_length=255)
    tags: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default=None, max_length=32)


class Node(NodeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: Optional["User"] = Relationship(back_populates="nodes")

    last_heartbeat: datetime | None = Field(default=None)

    credentials: List["Credential"] = Relationship(back_populates="nodes", link_model=NodeCredentialLink)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = Field(default=None, index=True)


class NodePublic(NodeBase):
    id: uuid.UUID
    last_heartbeat: datetime | None = None


class NodesPublic(SQLModel):
    data: list[NodePublic]
    count: int


# 节点注册相关模型
class NodeRegister(SQLModel):
    """从节点注册请求"""
    name: str = Field(max_length=255)
    host: str = Field(max_length=64)
    register_key: str = Field(max_length=255)
    desc: str | None = Field(default=None, max_length=255)
    tags: str | None = Field(default=None, max_length=255)


class NodeHeartbeat(SQLModel):
    """从节点心跳请求"""
    node_id: uuid.UUID
    register_key: str = Field(max_length=255)


class RegistrationKeyPublic(SQLModel):
    """注册密钥响应"""
    register_key: str
    docker_command: str

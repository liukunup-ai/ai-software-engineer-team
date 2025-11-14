import uuid
from sqlmodel import Field, SQLModel

class NodeBase(SQLModel):
    name: str = Field(index=True, max_length=255)
    ip: str = Field(max_length=64)
    description: str | None = Field(default=None, max_length=255)
    tags: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default="offline", max_length=32)  # offline/online/error

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

class NodePublic(NodeBase):
    id: uuid.UUID

class NodesPublic(SQLModel):
    data: list[NodePublic]
    count: int

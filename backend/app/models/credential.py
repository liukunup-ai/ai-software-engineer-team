import uuid
from typing import TYPE_CHECKING, Optional, List

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import ConfigDict
from sqlmodel import Field, Relationship, SQLModel

from .common import CredentialNodeLink
from .node import NodePublic

if TYPE_CHECKING:
    from .user import User
    from .node import Node



class CredentialCategory(str, Enum):
    GITHUB_COPILOT = "github-copilot"
    CURSOR = "cursor"
    CLUADE_CODE = "cluade-code"


class CredentialBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    category: CredentialCategory = Field(default=CredentialCategory.GITHUB_COPILOT)
    pat: str = Field(min_length=1, max_length=255)
    is_disabled: bool = Field(default=False)


class CredentialCreate(CredentialBase):
    node_ids: list[uuid.UUID] = Field(default_factory=list)


class CredentialUpdate(CredentialBase):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category: Optional[CredentialCategory] = Field(default=None)
    pat: Optional[str] = Field(default=None, max_length=255)
    is_disabled: Optional[bool] = Field(default=None)
    node_ids: Optional[list[uuid.UUID]] = None


class Credential(CredentialBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: Optional["User"] = Relationship(back_populates="credentials")

    nodes: List["Node"] = Relationship(back_populates="credentials", link_model=CredentialNodeLink)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CredentialPublic(CredentialBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    nodes: List[NodePublic] = Field(default_factory=list)


class CredentialsPublic(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    data: list[CredentialPublic]
    count: int

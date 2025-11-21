import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional, List
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User


class PromptBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    content: str = Field(max_length=5000)
    description: Optional[str] = Field(default=None, max_length=500)
    tags: Optional[str] = Field(default=None, max_length=255)


class PromptCreate(PromptBase):
    pass


class PromptUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    content: Optional[str] = Field(default=None, max_length=5000)
    description: Optional[str] = Field(default=None, max_length=500)
    tags: Optional[str] = Field(default=None, max_length=255)


class Prompt(PromptBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: Optional["User"] = Relationship(back_populates="prompts")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PromptPublic(PromptBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class PromptsPublic(SQLModel):
    data: list[PromptPublic]
    count: int
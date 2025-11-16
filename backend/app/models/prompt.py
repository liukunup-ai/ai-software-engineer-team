import uuid
from sqlmodel import Field, Relationship, SQLModel
from typing import Optional
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
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="prompts")


class PromptPublic(PromptBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class PromptsPublic(SQLModel):
    data: list[PromptPublic]
    count: int
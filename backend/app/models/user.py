import uuid

from typing import TYPE_CHECKING, List
from datetime import datetime
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .project import Project
    from .repository import Repository
    from .issue import Issue
    from .node import Node
    from .credential import Credential
    from .prompt import Prompt


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    full_name: str | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    hashed_password: str

    projects: List["Project"] = Relationship(back_populates="owner", cascade_delete=True)
    repositories: List["Repository"] = Relationship(back_populates="owner", cascade_delete=True)
    issues: List["Issue"] = Relationship(back_populates="owner", cascade_delete=True)
    nodes: List["Node"] = Relationship(back_populates="owner", cascade_delete=True)
    credentials: List["Credential"] = Relationship(back_populates="owner", cascade_delete=True)
    prompts: List["Prompt"] = Relationship(back_populates="owner", cascade_delete=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int

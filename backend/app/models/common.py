import uuid

from sqlmodel import Field, SQLModel


class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str


class ProjectMemberLink(SQLModel, table=True):
    project_id: uuid.UUID | None = Field(default=None, foreign_key="project.id", primary_key=True)
    member_id: uuid.UUID | None = Field(default=None, foreign_key="user.id", primary_key=True)


class ProjectRepositoryLink(SQLModel, table=True):
    project_id: uuid.UUID | None = Field(default=None, foreign_key="project.id", primary_key=True)
    repository_id: uuid.UUID | None = Field(default=None, foreign_key="repository.id", primary_key=True)


class ProjectIssueLink(SQLModel, table=True):
    project_id: uuid.UUID | None = Field(default=None, foreign_key="project.id", primary_key=True)
    issue_id: uuid.UUID | None = Field(default=None, foreign_key="issue.id", primary_key=True)


class ProjectNodeLink(SQLModel, table=True):
    project_id: uuid.UUID | None = Field(default=None, foreign_key="project.id", primary_key=True)
    node_id: uuid.UUID | None = Field(default=None, foreign_key="node.id", primary_key=True)


class NodeCredentialLink(SQLModel, table=True):
    node_id: uuid.UUID | None = Field(default=None, foreign_key="node.id", primary_key=True)
    credential_id: uuid.UUID | None = Field(default=None, foreign_key="credential.id", primary_key=True)

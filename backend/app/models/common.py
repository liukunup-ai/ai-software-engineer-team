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
    project_id: uuid.UUID = Field(foreign_key="project.id", primary_key=True, ondelete="CASCADE")
    member_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")


class ProjectRepositoryLink(SQLModel, table=True):
    project_id: uuid.UUID = Field(foreign_key="project.id", primary_key=True, ondelete="CASCADE")
    repository_id: uuid.UUID = Field(foreign_key="repository.id", primary_key=True, ondelete="CASCADE")


class ProjectIssueLink(SQLModel, table=True):
    project_id: uuid.UUID = Field(foreign_key="project.id", primary_key=True, ondelete="CASCADE")
    issue_id: uuid.UUID = Field(foreign_key="issue.id", primary_key=True, ondelete="CASCADE")


class ProjectNodeLink(SQLModel, table=True):
    project_id: uuid.UUID = Field(foreign_key="project.id", primary_key=True, ondelete="CASCADE")
    node_id: uuid.UUID = Field(foreign_key="node.id", primary_key=True, ondelete="CASCADE")


class NodeCredentialLink(SQLModel, table=True):
    __tablename__ = "credentialnodelink"
    node_id: uuid.UUID = Field(foreign_key="node.id", primary_key=True, ondelete="CASCADE")
    credential_id: uuid.UUID = Field(foreign_key="credential.id", primary_key=True, ondelete="CASCADE")

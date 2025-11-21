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


class CredentialNodeLink(SQLModel, table=True):
    credential_id: uuid.UUID | None = Field(default=None, foreign_key="credential.id", primary_key=True)
    node_id: uuid.UUID | None = Field(default=None, foreign_key="node.id", primary_key=True)

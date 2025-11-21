import uuid

from sqlmodel import Field, SQLModel


class CredentialNodeLink(SQLModel, table=True):
    credential_id: uuid.UUID | None = Field(default=None, foreign_key="credential.id", primary_key=True)
    node_id: uuid.UUID | None = Field(default=None, foreign_key="node.id", primary_key=True)

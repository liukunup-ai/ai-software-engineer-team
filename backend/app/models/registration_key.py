import secrets
from datetime import datetime

from sqlmodel import Field, SQLModel


class NodeRegistrationKey(SQLModel, table=True):
    """持久化的节点注册密钥 (单行表, id 永远为 1).

    表名使用下划线风格与其它表保持一致。
    """

    __tablename__ = "node_registration_key"

    id: int = Field(default=1, primary_key=True)
    key: str = Field(max_length=255, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def rotate(self) -> None:
        """旋转密钥并更新时间。"""
        self.key = secrets.token_urlsafe(32)
        self.updated_at = datetime.utcnow()

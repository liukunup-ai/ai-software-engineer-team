# 使 models 目录成为 Python 包
from sqlmodel import SQLModel

# 导入所有模型以便alembic可以检测到它们
from app.models.user import *
from app.models.project import *
from app.models.repository import *
from app.models.issue import *
from app.models.node import *
from app.models.credential import *
from app.models.prompt import *
from app.models.task import *

from app.models.common import *
from app.models.registration_key import *

__all__ = ["SQLModel"]

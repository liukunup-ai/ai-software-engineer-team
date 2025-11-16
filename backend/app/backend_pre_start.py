import logging
import secrets

from sqlalchemy import Engine
from sqlmodel import Session, select
from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

from app.core.db import engine
from app.models import NodeRegistrationKey
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

max_tries = 60 * 5  # 5 minutes
wait_seconds = 1


@retry(
    stop=stop_after_attempt(max_tries),
    wait=wait_fixed(wait_seconds),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
def init(db_engine: Engine) -> None:
    try:
        with Session(db_engine) as session:
            # Try to create session to check if DB is awake
            session.exec(select(1))
    except Exception as e:
        logger.error(e)
        raise e


def _ensure_registration_key(db_engine: Engine) -> None:
    """确保节点注册密钥已持久化保存。若不存在则创建。

    优先使用环境/配置中 settings.NODE_REGISTRATION_KEY 以支持外部指定；
    否则生成一个新的随机密钥。
    """
    with Session(db_engine) as session:
        try:
            obj = session.get(NodeRegistrationKey, 1)
        except Exception as e:  # 表未迁移等错误
            logger.warning(f"Could not query NodeRegistrationKey table yet: {e}")
            return
        if obj is None:
            initial_key = settings.NODE_REGISTRATION_KEY or secrets.token_urlsafe(32)
            obj = NodeRegistrationKey(key=initial_key)
            session.add(obj)
            session.commit()
            logger.info("Persisted new node registration key")
        elif settings.NODE_REGISTRATION_KEY != obj.key:
            logger.info("Detected different in-memory NODE_REGISTRATION_KEY; using persisted DB value")

def main() -> None:
    logger.info("Initializing service")
    init(engine)
    _ensure_registration_key(engine)
    logger.info("Service finished initializing")


if __name__ == "__main__":
    main()

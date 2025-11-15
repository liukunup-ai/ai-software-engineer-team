"""后台节点状态监控.

定期扫描所有节点的 last_heartbeat 时间, 若超过阈值则置为 offline.
"""
from __future__ import annotations

import threading
import time
from datetime import datetime, timedelta
from typing import Iterable

from sqlmodel import Session, select

from app.core.config import settings
from app.models import Node
from app.core.db import engine


def mark_offline_nodes(session: Session) -> int:
    """将超时未心跳的节点标记为 offline.

    返回修改的节点数量.
    """
    threshold = datetime.utcnow() - timedelta(seconds=settings.NODE_OFFLINE_THRESHOLD_SECONDS)
    # 选择仍标记为 online 但超过阈值或没有心跳的节点
    statement = select(Node).where(
        (Node.status == "online") & (
            (Node.last_heartbeat.is_(None)) | (Node.last_heartbeat < threshold)
        )
    )
    nodes: Iterable[Node] = session.exec(statement).all()
    changed = 0
    for node in nodes:
        node.status = "offline"
        session.add(node)
        changed += 1
    if changed:
        session.commit()
    return changed


def _loop():  # runs in background thread
    interval = settings.NODE_OFFLINE_CHECK_INTERVAL_SECONDS
    while True:
        try:
            with Session(engine) as session:
                changed = mark_offline_nodes(session)
                # 可在未来替换为 logger
                # print(f"[node_monitor] marked {changed} nodes offline")
        except Exception as exc:  # noqa: BLE001
            # 简单吞掉异常以避免线程退出
            print(f"[node_monitor] error: {exc}")
        time.sleep(interval)


_thread: threading.Thread | None = None


def start_node_monitor() -> None:
    global _thread
    if _thread and _thread.is_alive():  # 已启动
        return
    _thread = threading.Thread(target=_loop, name="node-monitor", daemon=True)
    _thread.start()

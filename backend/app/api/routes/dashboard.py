import uuid
from typing import Any
from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.models.issue import Issue
from app.models.node import Node
from app.models.project import Project
from app.models.prompt import Prompt
from app.models.credential import Credential
from app.models.repository import Repository
from app.models.task import Task

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class IssueStats(BaseModel):
    """Issue统计"""
    pending: int  # 待处理
    processing: int  # 处理中
    total: int  # 总数


class NodeStats(BaseModel):
    """Node统计"""
    idle: int  # 空闲
    running: int  # 运行中
    offline: int  # 离线
    total: int  # 总数


class RunningTask(BaseModel):
    """运行中的任务"""
    task_id: uuid.UUID
    issue_id: uuid.UUID
    issue_title: str
    node_name: str
    running_time: str  # 已运行时间(格式化字符串)
    started_at: datetime


class DashboardStats(BaseModel):
    """Dashboard统计数据"""
    issues: IssueStats
    nodes: NodeStats
    projects_count: int
    prompts_count: int
    credentials_count: int
    repositories_count: int
    running_tasks: list[RunningTask]


def format_duration(started_at: datetime) -> str:
    """格式化运行时间"""
    duration = datetime.utcnow() - started_at
    total_seconds = int(duration.total_seconds())
    
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    
    if hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    elif minutes > 0:
        return f"{minutes}m {seconds}s"
    else:
        return f"{seconds}s"


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """
    获取Dashboard统计数据
    - 普通用户:只统计自己的数据
    - 超级管理员:统计所有用户的数据
    """
    
    # 确定查询范围
    if current_user.is_superuser:
        # 超级管理员查看所有数据
        owner_filter = None
    else:
        # 普通用户只看自己的数据
        owner_filter = current_user.id
    
    # 1. Issue统计
    if owner_filter:
        pending_count = session.exec(
            select(func.count()).select_from(Issue)
            .where(Issue.owner_id == owner_filter, Issue.status == "pending")
        ).one()
        processing_count = session.exec(
            select(func.count()).select_from(Issue)
            .where(Issue.owner_id == owner_filter, Issue.status == "processing")
        ).one()
        total_issues = session.exec(
            select(func.count()).select_from(Issue)
            .where(Issue.owner_id == owner_filter)
        ).one()
    else:
        pending_count = session.exec(
            select(func.count()).select_from(Issue)
            .where(Issue.status == "pending")
        ).one()
        processing_count = session.exec(
            select(func.count()).select_from(Issue)
            .where(Issue.status == "processing")
        ).one()
        total_issues = session.exec(
            select(func.count()).select_from(Issue)
        ).one()
    
    issue_stats = IssueStats(
        pending=pending_count,
        processing=processing_count,
        total=total_issues
    )
    
    # 2. Node统计
    if owner_filter:
        # 普通用户的node统计
        idle_nodes = session.exec(
            select(func.count()).select_from(Node)
            .where(Node.owner_id == owner_filter, Node.status == "online")
        ).one()
        # 运行中的node需要查询是否有processing的issue
        running_nodes_stmt = select(func.count(func.distinct(Issue.assigned_node_id))).select_from(Issue).join(
            Node, Issue.assigned_node_id == Node.id
        ).where(
            Node.owner_id == owner_filter,
            Issue.status == "processing"
        )
        running_nodes = session.exec(running_nodes_stmt).one()
        
        offline_nodes = session.exec(
            select(func.count()).select_from(Node)
            .where(Node.owner_id == owner_filter, Node.status == "offline")
        ).one()
        total_nodes = session.exec(
            select(func.count()).select_from(Node)
            .where(Node.owner_id == owner_filter)
        ).one()
    else:
        # 超级管理员的node统计
        idle_nodes = session.exec(
            select(func.count()).select_from(Node)
            .where(Node.status == "online")
        ).one()
        
        running_nodes_stmt = select(func.count(func.distinct(Issue.assigned_node_id))).select_from(Issue).where(
            Issue.status == "processing"
        )
        running_nodes = session.exec(running_nodes_stmt).one()
        
        offline_nodes = session.exec(
            select(func.count()).select_from(Node)
            .where(Node.status == "offline")
        ).one()
        total_nodes = session.exec(
            select(func.count()).select_from(Node)
        ).one()
    
    # 空闲节点 = 在线节点 - 运行中节点
    actual_idle = idle_nodes - running_nodes if idle_nodes > running_nodes else 0
    
    node_stats = NodeStats(
        idle=actual_idle,
        running=running_nodes,
        offline=offline_nodes,
        total=total_nodes
    )
    
    # 3. Projects统计
    if owner_filter:
        projects_count = session.exec(
            select(func.count()).select_from(Project)
            .where(Project.owner_id == owner_filter)
        ).one()
    else:
        projects_count = session.exec(
            select(func.count()).select_from(Project)
        ).one()
    
    # 4. Prompts统计
    if owner_filter:
        prompts_count = session.exec(
            select(func.count()).select_from(Prompt)
            .where(Prompt.owner_id == owner_filter)
        ).one()
    else:
        prompts_count = session.exec(
            select(func.count()).select_from(Prompt)
        ).one()
    
    # 5. Credentials统计
    if owner_filter:
        credentials_count = session.exec(
            select(func.count()).select_from(Credential)
            .where(Credential.owner_id == owner_filter)
        ).one()
    else:
        credentials_count = session.exec(
            select(func.count()).select_from(Credential)
        ).one()
    
    # 6. Repositories统计
    if owner_filter:
        repositories_count = session.exec(
            select(func.count()).select_from(Repository)
            .where(Repository.owner_id == owner_filter)
        ).one()
    else:
        repositories_count = session.exec(
            select(func.count()).select_from(Repository)
        ).one()
    
    # 7. 运行中的任务列表
    if owner_filter:
        running_tasks_stmt = (
            select(Task, Issue, Node)
            .join(Issue, Task.issue_id == Issue.id)
            .join(Node, Task.node_id == Node.id)
            .where(
                Task.owner_id == owner_filter,
                Task.status == "running"
            )
            .order_by(Task.started_at.desc())
            .limit(10)
        )
    else:
        running_tasks_stmt = (
            select(Task, Issue, Node)
            .join(Issue, Task.issue_id == Issue.id)
            .join(Node, Task.node_id == Node.id)
            .where(Task.status == "running")
            .order_by(Task.started_at.desc())
            .limit(10)
        )
    
    results = session.exec(running_tasks_stmt).all()
    
    running_tasks = []
    for task, issue, node in results:
        if task.started_at:
            running_tasks.append(RunningTask(
                task_id=task.id,
                issue_id=issue.id,
                issue_title=issue.title,
                node_name=node.name,
                running_time=format_duration(task.started_at),
                started_at=task.started_at
            ))
    
    return DashboardStats(
        issues=issue_stats,
        nodes=node_stats,
        projects_count=projects_count,
        prompts_count=prompts_count,
        credentials_count=credentials_count,
        repositories_count=repositories_count,
        running_tasks=running_tasks
    )

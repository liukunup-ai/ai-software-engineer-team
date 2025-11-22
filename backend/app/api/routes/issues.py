import uuid
from typing import Any, List
from datetime import datetime
import httpx

from fastapi import APIRouter, HTTPException, BackgroundTasks
from sqlmodel import func, select
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.models import Message
from app.models.issue import Issue, IssueCreate, IssuePublic, IssuesPublic, IssueUpdate
from app.models.task import Task, TaskCreate, TaskPublic
from app.models.node import Node
from app.models.repository import Repository
from app.services.workflow import WorkflowService
from app.services.github_sync import GitHubSyncService
from app.services.node_selection import NodeSelectionService

router = APIRouter(prefix="/issues", tags=["issues"])


@router.get("/", response_model=IssuesPublic)
def read_issues(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """获取Issue列表"""
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Issue)
        count = session.exec(count_statement).one()
        statement = select(Issue).offset(skip).limit(limit).order_by(Issue.priority.desc(), Issue.created_at.desc())
        issues = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Issue)
            .where(Issue.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Issue)
            .where(Issue.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
            .order_by(Issue.priority.desc(), Issue.created_at.desc())
        )
        issues = session.exec(statement).all()

    return IssuesPublic(data=[IssuePublic(**i.model_dump()) for i in issues], count=count)


@router.get("/{id}", response_model=IssuePublic)
def read_issue(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """获取指定Issue"""
    issue = session.get(Issue, id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    if not current_user.is_superuser and (issue.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return IssuePublic(**issue.model_dump())


@router.post("/", response_model=IssuePublic)
def create_issue(
    *, session: SessionDep, current_user: CurrentUser, issue_in: IssueCreate
) -> Any:
    """创建新Issue"""
    issue = Issue.model_validate(issue_in, update={"owner_id": current_user.id})
    session.add(issue)
    session.commit()
    session.refresh(issue)
    return IssuePublic(**issue.model_dump())


@router.put("/{id}", response_model=IssuePublic)
def update_issue(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    issue_in: IssueUpdate,
) -> Any:
    """更新Issue"""
    issue = session.get(Issue, id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    if not current_user.is_superuser and (issue.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_dict = issue_in.model_dump(exclude_unset=True)
    issue.sqlmodel_update(update_dict)
    issue.updated_at = datetime.utcnow()
    session.add(issue)
    session.commit()
    session.refresh(issue)
    return IssuePublic(**issue.model_dump())


@router.delete("/{id}")
def delete_issue(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """删除Issue"""
    issue = session.get(Issue, id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    if not current_user.is_superuser and (issue.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(issue)
    session.commit()
    return Message(message="Issue deleted successfully")


@router.get("/pending/next", response_model=IssuePublic)
def get_next_pending_issue(session: SessionDep, current_user: CurrentUser) -> Any:
    """获取下一个待处理的Issue（按优先级和创建时间排序）"""
    if current_user.is_superuser:
        statement = (
            select(Issue)
            .where(Issue.status == "pending")
            .order_by(Issue.priority.desc(), Issue.created_at.asc())
            .limit(1)
        )
    else:
        statement = (
            select(Issue)
            .where(Issue.owner_id == current_user.id, Issue.status == "pending")
            .order_by(Issue.priority.desc(), Issue.created_at.asc())
            .limit(1)
        )
    
    issue = session.exec(statement).first()
    if not issue:
        raise HTTPException(status_code=404, detail="No pending issues found")
    
    return IssuePublic(**issue.model_dump())


@router.post("/{id}/process")
async def process_issue_workflow(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    node_id: uuid.UUID,
    background_tasks: BackgroundTasks
) -> Message:
    """启动Issue自动处理工作流"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    issue = session.get(Issue, id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # 在后台启动工作流
    background_tasks.add_task(
        WorkflowService.auto_process_workflow,
        session,
        id,
        node_id
    )
    
    return Message(message="Issue processing started")


@router.post("/{id}/commit-push")
async def commit_and_push_issue(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    commit_message: str | None = None
) -> dict:
    """提交并推送Issue的代码更改"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        results = await WorkflowService.commit_and_push(session, id, commit_message)
        return {"message": "Code committed and pushed successfully", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class GitHubSyncRequest(BaseModel):
    """GitHub同步请求模型"""
    repo_owner: str
    repo_name: str
    labels: List[str] | None = None


class GitHubMultiSyncRequest(BaseModel):
    """GitHub多仓库同步请求模型"""
    repos: List[dict]  # [{"owner": "...", "name": "...", "labels": [...]}]
    github_token: str | None = None


@router.post("/sync/github")
async def sync_github_issues(
    session: SessionDep,
    current_user: CurrentUser,
    sync_request: GitHubSyncRequest
) -> dict:
    """从 GitHub 仓库同步 issues"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        github_service = GitHubSyncService()
        stats = await github_service.sync_issues_to_db(
            session=session,
            owner_id=current_user.id,
            repo_owner=sync_request.repo_owner,
            repo_name=sync_request.repo_name,
            labels=sync_request.labels
        )
        return {"message": "GitHub issues synced successfully", "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync/github/batch")
async def sync_multiple_github_repos(
    session: SessionDep,
    current_user: CurrentUser,
    sync_request: GitHubMultiSyncRequest
) -> dict:
    """批量从多个 GitHub 仓库同步 issues"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        github_service = GitHubSyncService(sync_request.github_token)
        stats = await github_service.sync_multiple_repos(
            session=session,
            owner_id=current_user.id,
            repos=sync_request.repos
        )
        return {"message": "Multiple GitHub repos synced successfully", "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class StartTaskRequest(BaseModel):
    """启动任务请求模型"""
    command: str | None = None  # 可选的自定义命令


@router.post("/{id}/start", response_model=TaskPublic)
async def start_issue_task(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    request: StartTaskRequest | None = None
) -> Any:
    """
    启动Issue自动化处理任务
    1. 查询issue和关联的仓库
    2. 自动选择空闲的node
    3. 查询node可用凭证
    4. 创建任务记录
    5. 下发任务给node处理
    """
    # 获取issue
    issue = session.get(Issue, id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    if not current_user.is_superuser and (issue.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # 检查issue状态
    if issue.status == "processing":
        raise HTTPException(status_code=400, detail="Issue is already being processed")
    
    # 查询关联的仓库
    if not issue.repository_url:
        raise HTTPException(status_code=400, detail="Issue has no associated repository")
    
    # 自动选择空闲的node
    node = NodeSelectionService.select_best_node(session)
    if not node:
        raise HTTPException(status_code=503, detail="No available node found")
    
    # 查询node的可用凭证
    if not node.credentials or len(node.credentials) == 0:
        raise HTTPException(status_code=400, detail=f"Node {node.name} has no available credentials")
    
    # 使用第一个可用凭证
    credential = node.credentials[0]
    
    # 更新issue状态为processing
    issue.status = "processing"
    issue.assigned_node_id = node.id
    issue.started_at = datetime.utcnow()
    issue.updated_at = datetime.utcnow()
    session.add(issue)
    
    # 创建任务记录
    command = request.command if request and request.command else f"process issue #{issue.issue_number}"
    task = Task(
        owner_id=current_user.id,
        issue_id=issue.id,
        node_id=node.id,
        status="running",
        command=command,
        started_at=datetime.utcnow()
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    
    # 异步下发任务给node
    try:
        # 构造下发给node的请求数据
        node_url = f"http://{node.ip}:8007/process-issue"
        payload = {
            "issue_id": str(issue.id),
            "task_id": str(task.id),
            "repository_url": issue.repository_url,
            "issue_number": issue.issue_number,
            "issue_title": issue.title,
            "issue_description": issue.description,
            "credential_token": credential.token,
            "command": command
        }
        
        # 发送HTTP请求到node
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(node_url, json=payload)
            response.raise_for_status()
            
    except Exception as e:
        # 如果下发失败,更新任务和issue状态
        task.status = "failed"
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        issue.status = "terminated"
        issue.error_message = str(e)
        session.add(task)
        session.add(issue)
        session.commit()
        raise HTTPException(status_code=500, detail=f"Failed to dispatch task to node: {str(e)}")
    
    return TaskPublic(**task.model_dump())


class ReportBranchRequest(BaseModel):
    """上报分支请求模型"""
    task_id: uuid.UUID
    branch_name: str
    status: str  # success/failed
    error_message: str | None = None


@router.post("/{id}/report-branch")
async def report_branch(
    *,
    session: SessionDep,
    id: uuid.UUID,
    request: ReportBranchRequest
) -> Message:
    """
    Node上报处理完成的分支名
    1. 更新task状态
    2. 更新issue状态为待合入
    3. 记录分支名
    """
    # 获取issue
    issue = session.get(Issue, id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # 获取task
    task = session.get(Task, request.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.issue_id != issue.id:
        raise HTTPException(status_code=400, detail="Task does not belong to this issue")
    
    # 更新task状态
    task.status = request.status
    task.result_branch = request.branch_name
    task.error_message = request.error_message
    task.completed_at = datetime.utcnow()
    task.updated_at = datetime.utcnow()
    session.add(task)
    
    # 更新issue状态
    if request.status == "success":
        issue.status = "pending_merge"
        issue.result_branch = request.branch_name
    else:
        issue.status = "terminated"
        issue.error_message = request.error_message
    
    issue.completed_at = datetime.utcnow()
    issue.updated_at = datetime.utcnow()
    session.add(issue)
    
    session.commit()
    
    return Message(message=f"Branch {request.branch_name} reported successfully")


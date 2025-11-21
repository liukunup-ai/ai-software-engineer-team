import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Project, ProjectCreate, ProjectPublic, ProjectsPublic, ProjectUpdate, Message
from app.models import Repository

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=ProjectsPublic)
def read_projects(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve projects.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Project)
        count = session.exec(count_statement).one()
        statement = select(Project).offset(skip).limit(limit)
        projects = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Project)
            .where(Project.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Project)
            .where(Project.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        projects = session.exec(statement).all()

    return ProjectsPublic(data=projects, count=count)


@router.get("/{id}", response_model=ProjectPublic)
def read_project(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get project by ID.
    """
    project = session.get(Project, id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and (project.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return project


@router.post("/", response_model=ProjectPublic)
def create_project(
    *, session: SessionDep, current_user: CurrentUser, project_in: ProjectCreate
) -> Any:
    """
    Create new project.
    """
    # 创建项目
    project = Project.model_validate(project_in, update={"owner_id": current_user.id})
    session.add(project)
    session.commit()
    session.refresh(project)
    
    # 处理repository_urls，为每个URL创建Repository记录
    if project_in.repository_urls:
        for url in project_in.repository_urls:
            url = url.strip()
            if url:  # 确保URL不为空
                # 从URL中提取仓库名称作为默认名称
                repo_name = url.rstrip('/').split('/')[-1]
                if repo_name.endswith('.git'):
                    repo_name = repo_name[:-4]
                
                # 创建Repository记录
                repository = Repository(
                    name=repo_name,
                    url=url,
                    owner_id=current_user.id,
                    is_public=True  # 默认为公开
                )
                session.add(repository)
        
        session.commit()
    
    return project


@router.put("/{id}", response_model=ProjectPublic)
def update_project(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    project_in: ProjectUpdate
) -> Any:
    """
    Update a project.
    """
    project = session.get(Project, id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and (project.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
        
    update_dict = project_in.model_dump(exclude_unset=True)
    project.sqlmodel_update(update_dict)
    session.add(project)
    session.commit()
    session.refresh(project)
    
    # 处理repository_urls更新
    if project_in.repository_urls is not None:
        for url in project_in.repository_urls:
            url = url.strip()
            if url:  # 确保URL不为空
                # 从URL中提取仓库名称作为默认名称
                repo_name = url.rstrip('/').split('/')[-1]
                if repo_name.endswith('.git'):
                    repo_name = repo_name[:-4]
                
                # 创建Repository记录
                repository = Repository(
                    name=repo_name,
                    url=url,
                    owner_id=current_user.id,
                    is_public=True  # 默认为公开
                )
                session.add(repository)
        
        session.commit()
    
    return project


@router.delete("/{id}")
def delete_project(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Message:
    """
    Delete a project.
    """
    project = session.get(Project, id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and (project.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    session.delete(project)
    session.commit()
    return Message(message="Project deleted successfully")
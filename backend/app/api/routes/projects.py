import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlmodel import Session, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Project, ProjectCreate, ProjectPublic, ProjectsPublic, ProjectUpdate, Message
from app.models import Repository

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=ProjectsPublic)
def read_projects(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
) -> Any:
    """
    Retrieve projects.
    """
    filters: list[Any] = []
    if not current_user.is_superuser:
        filters.append(Project.owner_id == current_user.id)

    if search:
        normalized = f"%{search.strip()}%"
        filters.append(
            or_(
                Project.name.ilike(normalized),
                Project.description.ilike(normalized),
            )
        )

    count_statement = select(func.count()).select_from(Project)
    statement = select(Project).offset(skip).limit(limit)

    for condition in filters:
        count_statement = count_statement.where(condition)
        statement = statement.where(condition)

    projects = session.exec(statement).all()
    count = session.exec(count_statement).one()

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
    project = Project.model_validate(project_in, update={"owner_id": current_user.id})
    session.add(project)
    session.flush()

    _sync_project_repositories(
        session=session,
        project=project,
        owner_id=current_user.id,
        repository_ids=project_in.repository_ids,
        repository_urls=project_in.repository_urls,
    )

    session.commit()
    session.refresh(project)
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
    _sync_project_repositories(
        session=session,
        project=project,
        owner_id=current_user.id,
        repository_ids=project_in.repository_ids,
        repository_urls=project_in.repository_urls,
    )

    session.add(project)
    session.commit()
    session.refresh(project)
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


def _sync_project_repositories(
    *,
    session: Session,
    project: Project,
    owner_id: uuid.UUID,
    repository_ids: list[uuid.UUID] | None,
    repository_urls: list[str] | None,
) -> bool:
    ids_provided = repository_ids is not None
    urls_provided = repository_urls is not None
    if not ids_provided and not urls_provided:
        return False

    repositories_by_id: dict[uuid.UUID, Repository] = {}

    if ids_provided:
        ids_to_link = list(dict.fromkeys(repository_ids or []))
        if ids_to_link:
            existing_repositories = session.exec(
                select(Repository).where(Repository.id.in_(ids_to_link))
            ).all()
        else:
            existing_repositories = []

        existing_ids = {repo.id for repo in existing_repositories}
        missing_ids = [str(repo_id) for repo_id in set(ids_to_link) if repo_id not in existing_ids]
        if missing_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Repositories not found: {', '.join(missing_ids)}",
            )

        for repo in existing_repositories:
            repositories_by_id[repo.id] = repo

    if urls_provided:
        normalized_urls: list[str] = []
        seen_urls: set[str] = set()
        for raw_url in repository_urls or []:
            normalized = _normalize_repository_url(raw_url)
            if not normalized or normalized in seen_urls:
                continue
            seen_urls.add(normalized)
            normalized_urls.append(normalized)

        for normalized_url in normalized_urls:
            repository = session.exec(
                select(Repository).where(Repository.url == normalized_url)
            ).first()
            if not repository:
                repository = Repository(
                    name=_derive_repository_name(normalized_url),
                    url=normalized_url,
                    owner_id=owner_id,
                )
                session.add(repository)
                session.flush()
            repositories_by_id[repository.id] = repository

    project.repositories = list(repositories_by_id.values())
    session.add(project)
    return True


def _normalize_repository_url(raw_url: str) -> str:
    normalized = raw_url.strip()
    if not normalized:
        return ""
    return normalized.rstrip("/")


def _derive_repository_name(url: str) -> str:
    candidate = url.rstrip("/").split("/")[-1]
    if candidate.endswith(".git"):
        candidate = candidate[:-4]
    candidate = candidate or "repository"
    return candidate
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Repository, RepositoryCreate, RepositoryPublic, RepositoriesPublic, RepositoryUpdate, Message

router = APIRouter(prefix="/repositories", tags=["repositories"])


@router.get("/", response_model=RepositoriesPublic)
def read_repositories(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve repositories.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Repository)
        count = session.exec(count_statement).one()
        statement = select(Repository).offset(skip).limit(limit)
        repositories = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Repository)
            .where(Repository.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Repository)
            .where(Repository.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        repositories = session.exec(statement).all()

    return RepositoriesPublic(data=repositories, count=count)


@router.get("/{id}", response_model=RepositoryPublic)
def read_repository(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get repository by ID.
    """
    repository = session.get(Repository, id)
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")
    if not current_user.is_superuser and (repository.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return repository


@router.post("/", response_model=RepositoryPublic)
def create_repository(
    *, session: SessionDep, current_user: CurrentUser, repository_in: RepositoryCreate
) -> Any:
    """
    Create new repository.
    """
    repository = Repository.model_validate(repository_in, update={"owner_id": current_user.id})
    session.add(repository)
    session.commit()
    session.refresh(repository)
    return repository


@router.put("/{id}", response_model=RepositoryPublic)
def update_repository(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    repository_in: RepositoryUpdate,
) -> Any:
    """
    Update a repository.
    """
    repository = session.get(Repository, id)
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")
    if not current_user.is_superuser and (repository.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = repository_in.model_dump(exclude_unset=True)
    repository.sqlmodel_update(update_dict)
    session.add(repository)
    session.commit()
    session.refresh(repository)
    return repository


@router.delete("/{id}")
def delete_repository(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a repository.
    """
    repository = session.get(Repository, id)
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")
    if not current_user.is_superuser and (repository.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(repository)
    session.commit()
    return Message(message="Repository deleted successfully")
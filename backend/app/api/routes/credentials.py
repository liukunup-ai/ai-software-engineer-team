import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Credential,
    CredentialCreate,
    CredentialPublic,
    CredentialsPublic,
    CredentialUpdate,
    Message,
    Node,
)

router = APIRouter(prefix="/credentials", tags=["credentials"])


def _resolve_nodes(session: SessionDep, node_ids: list[uuid.UUID]) -> list[Node]:
    if not node_ids:
        return []
    statement = select(Node).where(Node.id.in_(node_ids))
    nodes = session.exec(statement).all()
    found_ids = {node.id for node in nodes}
    missing = set(node_ids) - found_ids
    if missing:
        missing_str = ", ".join(str(node_id) for node_id in sorted(missing))
        raise HTTPException(status_code=404, detail=f"Nodes not found: {missing_str}")
    return nodes


@router.get("/", response_model=CredentialsPublic)
def read_credentials(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve credentials.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Credential)
        count = session.exec(count_statement).one()
        statement = (
            select(Credential)
            .options(selectinload(Credential.nodes))
            .offset(skip)
            .limit(limit)
        )
        credentials = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Credential)
            .where(Credential.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Credential)
            .where(Credential.owner_id == current_user.id)
            .options(selectinload(Credential.nodes))
            .offset(skip)
            .limit(limit)
        )
        credentials = session.exec(statement).all()

    return CredentialsPublic(data=credentials, count=count)


@router.get("/{id}", response_model=CredentialPublic)
def read_credential(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get credential by ID.
    """
    credential = session.exec(
        select(Credential)
            .where(Credential.id == id)
            .options(selectinload(Credential.nodes))
    ).one_or_none()
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    if not current_user.is_superuser and (credential.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return credential


@router.post("/", response_model=CredentialPublic)
def create_credential(
    *, session: SessionDep, current_user: CurrentUser, credential_in: CredentialCreate
) -> Any:
    """
    Create new credential.
    """
    credential_data = credential_in.model_dump(exclude={"node_ids"})
    credential = Credential(**credential_data, owner_id=current_user.id)
    credential.nodes = _resolve_nodes(session, credential_in.node_ids)
    session.add(credential)
    session.commit()
    session.refresh(credential)
    return credential


@router.put("/{id}", response_model=CredentialPublic)
def update_credential(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    credential_in: CredentialUpdate,
) -> Any:
    """
    Update a credential.
    """
    credential = session.exec(
        select(Credential)
            .where(Credential.id == id)
            .options(selectinload(Credential.nodes))
    ).one_or_none()
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    if not current_user.is_superuser and (credential.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = credential_in.model_dump(exclude_unset=True, exclude={"node_ids"})
    credential.sqlmodel_update(update_dict)
    if credential_in.node_ids is not None:
        credential.nodes = _resolve_nodes(session, credential_in.node_ids)
    session.add(credential)
    session.commit()
    session.refresh(credential)
    return credential


@router.delete("/{id}")
def delete_credential(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a credential.
    """
    credential = session.get(Credential, id)
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    if not current_user.is_superuser and (credential.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(credential)
    session.commit()
    return Message(message="Credential deleted successfully")
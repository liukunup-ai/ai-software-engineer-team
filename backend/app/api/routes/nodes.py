import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select, func

from app.api.deps import CurrentUser, SessionDep
from app.models import Node, NodeCreate, NodePublic, NodesPublic, NodeUpdate, Message

router = APIRouter(prefix="/nodes", tags=["nodes"])

@router.get("/", response_model=NodesPublic)
def read_nodes(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100) -> Any:
    """Retrieve nodes. (目前仅超级管理员可见)"""
    if not current_user.is_superuser:
        # 非超级用户返回空集合，亦可选择抛出 403
        return NodesPublic(data=[], count=0)
    count_statement = select(func.count()).select_from(Node)
    count = session.exec(count_statement).one()
    statement = select(Node).offset(skip).limit(limit)
    nodes = session.exec(statement).all()
    return NodesPublic(data=[NodePublic(**n.model_dump()) for n in nodes], count=count)

@router.post("/", response_model=NodePublic)
def create_node(session: SessionDep, current_user: CurrentUser, node_in: NodeCreate) -> Any:
    """Create new node (超级管理员)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    node = Node(**node_in.model_dump())
    session.add(node)
    session.commit()
    session.refresh(node)
    return NodePublic(**node.model_dump())

@router.get("/{id}", response_model=NodePublic)
def read_node(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """Get node by ID."""
    node = session.get(Node, id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return NodePublic(**node.model_dump())

@router.put("/{id}", response_model=NodePublic)
def update_node(session: SessionDep, current_user: CurrentUser, id: uuid.UUID, node_in: NodeUpdate) -> Any:
    """Update a node."""
    node = session.get(Node, id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    update_dict = node_in.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(node, k, v)
    session.add(node)
    session.commit()
    session.refresh(node)
    return NodePublic(**node.model_dump())

@router.delete("/{id}")
def delete_node(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Message:
    """Delete a node."""
    node = session.get(Node, id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(node)
    session.commit()
    return Message(message="Node deleted successfully")

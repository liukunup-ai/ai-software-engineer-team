import uuid
from typing import Any
from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlmodel import select, func

from app.api.deps import CurrentUser, SessionDep
from app.models import Node, NodeCreate, NodePublic, NodesPublic, NodeUpdate, Message
from app.models.node import NodeRegister, NodeHeartbeat, RegistrationKeyPublic
from app.core.config import settings

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

@router.get("/registration-key", response_model=RegistrationKeyPublic)
def get_registration_key(current_user: CurrentUser) -> Any:
    """获取节点注册密钥和Docker命令 (超级管理员)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # 构造 Docker 命令示例
    backend_url = settings.FRONTEND_HOST.replace("5173", "8000")  # 简单替换端口
    docker_command = f"""docker run -d \\
  --name ai-node \\
  -e NODE_NAME="my-node" \\
  -e NODE_IP="$(hostname -I | awk '{{print $1}}')" \\
  -e REGISTRATION_KEY="{settings.NODE_REGISTRATION_KEY}" \\
  -e BACKEND_URL="{backend_url}/api/v1" \\
  your-registry/ai-node:latest"""
    
    return RegistrationKeyPublic(
        registration_key=settings.NODE_REGISTRATION_KEY,
        docker_command=docker_command
    )

@router.post("/register", response_model=NodePublic)
def register_node(session: SessionDep, node_in: NodeRegister) -> Any:
    """从节点自动注册接口 (无需认证,通过注册密钥验证)."""
    # 验证注册密钥
    if node_in.registration_key != settings.NODE_REGISTRATION_KEY:
        raise HTTPException(status_code=401, detail="Invalid registration key")
    
    # 检查是否已存在同名节点
    statement = select(Node).where(Node.name == node_in.name)
    existing_node = session.exec(statement).first()
    
    if existing_node:
        # 更新现有节点的心跳时间和状态
        existing_node.ip = node_in.ip
        existing_node.status = "online"
        existing_node.last_heartbeat = datetime.utcnow()
        if node_in.description:
            existing_node.description = node_in.description
        if node_in.tags:
            existing_node.tags = node_in.tags
        session.add(existing_node)
        session.commit()
        session.refresh(existing_node)
        return NodePublic(**existing_node.model_dump())
    
    # 创建新节点
    node = Node(
        name=node_in.name,
        ip=node_in.ip,
        description=node_in.description,
        tags=node_in.tags,
        status="online",
        last_heartbeat=datetime.utcnow()
    )
    session.add(node)
    session.commit()
    session.refresh(node)
    return NodePublic(**node.model_dump())

@router.post("/heartbeat")
def node_heartbeat(session: SessionDep, heartbeat: NodeHeartbeat) -> Message:
    """从节点心跳接口 (无需认证,通过注册密钥验证)."""
    # 验证注册密钥
    if heartbeat.registration_key != settings.NODE_REGISTRATION_KEY:
        raise HTTPException(status_code=401, detail="Invalid registration key")
    
    # 查找节点
    node = session.get(Node, heartbeat.node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # 更新心跳时间和状态
    node.last_heartbeat = datetime.utcnow()
    if heartbeat.status:
        node.status = heartbeat.status
    session.add(node)
    session.commit()
    
    return Message(message="Heartbeat received")

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



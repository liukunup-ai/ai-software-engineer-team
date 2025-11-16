import uuid
from typing import Any
from datetime import datetime
import httpx
from fastapi import APIRouter, HTTPException
from sqlmodel import select, func

from app.api.deps import CurrentUser, SessionDep
from app.models import Node, NodeCreate, NodePublic, NodesPublic, NodeUpdate, Message
from app.models.node import NodeRegister, NodeHeartbeat, RegistrationKeyPublic
from app.models.registration_key import NodeRegistrationKey
from app.models.command import CommandRequest, CommandResult
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
def get_registration_key(session: SessionDep, current_user: CurrentUser) -> Any:
    """获取节点注册密钥和 Docker 运行示例命令 (超级管理员)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # 构造 Docker 命令示例 (变量名与最新注册模型保持一致: HOST / REGISTER_KEY)
    backend_url = settings.FRONTEND_HOST.replace("5173", "8000")  # 简单替换端口，假设后端为 8000
    docker_command = f"""docker run -d \\
  -e REGISTER_URL="{backend_url}" \\
  -e REGISTER_KEY="{settings.NODE_REGISTRATION_KEY}" \\
  -e NODE_NAME="aise-worker-node" \\
  -e NODE_HOST="$(hostname -I | awk '{{print $1}}')" \\
  -e NODE_PORT="8007" \\
  -e TZ=Asia/Shanghai \\
  --restart=unless-stopped \\
  --name=aise-worker-node \\
  liukunup/ai-software-engineer:latest"""

    # 从数据库读取持久化注册密钥
    db_key_obj = session.get(NodeRegistrationKey, 1)
    if not db_key_obj:
        # 自动初始化，避免 500 错误
        db_key_obj = NodeRegistrationKey(key=settings.NODE_REGISTRATION_KEY)
        session.add(db_key_obj)
        session.commit()
        session.refresh(db_key_obj)

    return RegistrationKeyPublic(
        registration_key=db_key_obj.key,
        docker_command=docker_command.replace(settings.NODE_REGISTRATION_KEY, db_key_obj.key),
    )

@router.post("/registration-key/rotate", response_model=RegistrationKeyPublic)
def rotate_registration_key(session: SessionDep, current_user: CurrentUser) -> Any:
    """旋转节点注册密钥 (超级管理员). 返回新密钥与新 Docker 示例命令。"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    db_key_obj = session.get(NodeRegistrationKey, 1)
    if not db_key_obj:
        raise HTTPException(status_code=500, detail="Registration key not initialized")
    old_key = db_key_obj.key
    db_key_obj.rotate()
    session.add(db_key_obj)
    session.commit()
    # 重新生成 docker 命令并替换旧密钥
    backend_url = settings.FRONTEND_HOST.replace("5173", "8000")
    docker_command = f"""docker run -d \
  -e REGISTER_URL=\"{backend_url}\" \
  -e REGISTER_KEY=\"{db_key_obj.key}\" \
  -e NODE_NAME=\"aise-worker-node\" \
  -e NODE_HOST=\"$(hostname -I | awk '{{print $1}}')\" \
  -e NODE_PORT=\"8007\" \
  -e TZ=Asia/Shanghai \
  --restart=unless-stopped \
  --name=aise-worker-node \
  liukunup/ai-software-engineer:latest"""
    return RegistrationKeyPublic(registration_key=db_key_obj.key, docker_command=docker_command)

@router.post("/register", response_model=NodePublic)
def register_node(session: SessionDep, node_in: NodeRegister) -> Any:
    """从节点自动注册接口 (无需认证, 通过 register_key 验证)."""
    # 验证注册密钥字段名: register_key
    db_key_obj = session.get(NodeRegistrationKey, 1)
    if not db_key_obj:
        # 若未初始化则拒绝并引导管理员先获取密钥
        raise HTTPException(status_code=503, detail="Registration key not ready; please fetch /nodes/registration-key first")
    if node_in.register_key != db_key_obj.key:
        raise HTTPException(status_code=401, detail="Invalid register key")

    # 检查是否已存在同名节点
    statement = select(Node).where(Node.name == node_in.name)
    existing_node = session.exec(statement).first()

    if existing_node:
        # 更新现有节点的 IP / 描述 / 标签 与心跳
        existing_node.ip = node_in.host
        existing_node.status = "online"
        existing_node.last_heartbeat = datetime.utcnow()
        if node_in.desc is not None:
            existing_node.description = node_in.desc
        if node_in.tags is not None:
            existing_node.tags = node_in.tags
        session.add(existing_node)
        session.commit()
        session.refresh(existing_node)
        return NodePublic(**existing_node.model_dump())

    # 创建新节点 (desc -> description, host -> ip)
    node = Node(
        name=node_in.name,
        ip=node_in.host,
        description=node_in.desc,
        tags=node_in.tags,
        status="online",
        last_heartbeat=datetime.utcnow(),
    )
    session.add(node)
    session.commit()
    session.refresh(node)
    return NodePublic(**node.model_dump())

@router.post("/heartbeat")
def node_heartbeat(session: SessionDep, heartbeat: NodeHeartbeat) -> Message:
    """从节点心跳接口 (无需认证, 通过 register_key 验证)."""
    db_key_obj = session.get(NodeRegistrationKey, 1)
    if not db_key_obj:
        raise HTTPException(status_code=503, detail="Registration key not ready; please fetch /nodes/registration-key first")
    if heartbeat.register_key != db_key_obj.key:
        raise HTTPException(status_code=401, detail="Invalid register key")

    node = session.get(Node, heartbeat.node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    node.last_heartbeat = datetime.utcnow()
    # 心跳不再携带状态字段，默认保持原状态或置为 online
    if node.status != "online":
        node.status = "online"
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


@router.post("/{id}/execute", response_model=CommandResult)
async def execute_command_on_node(
    session: SessionDep, 
    current_user: CurrentUser, 
    id: uuid.UUID, 
    command_req: CommandRequest
) -> Any:
    """在指定节点上执行命令"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    node = session.get(Node, id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    if node.status != "online":
        raise HTTPException(status_code=400, detail="Node is not online")
    
    # 构造从节点的执行URL
    node_url = f"http://{node.ip}:8007/execute"
    
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                node_url,
                json=command_req.model_dump()
            )
            response.raise_for_status()
            return CommandResult(**response.json())
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute command on node: {str(e)}")



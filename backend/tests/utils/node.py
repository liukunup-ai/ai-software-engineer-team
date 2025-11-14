"""Node utility functions for tests"""
from sqlmodel import Session

from app.crud import create_node
from app.models import Node, NodeCreate


def create_random_node(db: Session) -> Node:
    """Create a random node for testing"""
    name = f"test-node-{id(db)}"
    ip = "192.168.1.100"
    description = "Test node description"
    tags = "test,random"
    status = "offline"
    
    node_in = NodeCreate(
        name=name,
        ip=ip,
        description=description,
        tags=tags,
        status=status,
    )
    return create_node(session=db, node_in=node_in)

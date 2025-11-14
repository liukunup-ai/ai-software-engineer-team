"""Tests for Node CRUD operations"""
import uuid

import pytest
from sqlmodel import Session

from app.crud import create_node, delete_node, get_node, update_node
from app.models import NodeCreate, NodeUpdate
from tests.utils.node import create_random_node


def test_create_node(db: Session) -> None:
    """Test creating a node"""
    name = "test-node"
    ip = "192.168.1.50"
    description = "Test node"
    tags = "test,crud"
    status = "online"
    
    node_in = NodeCreate(
        name=name,
        ip=ip,
        description=description,
        tags=tags,
        status=status,
    )
    node = create_node(session=db, node_in=node_in)
    
    assert node.name == name
    assert node.ip == ip
    assert node.description == description
    assert node.tags == tags
    assert node.status == status
    assert node.id is not None


def test_get_node(db: Session) -> None:
    """Test getting a node by ID"""
    node = create_random_node(db)
    retrieved_node = get_node(session=db, node_id=node.id)
    
    assert retrieved_node is not None
    assert retrieved_node.id == node.id
    assert retrieved_node.name == node.name
    assert retrieved_node.ip == node.ip


def test_get_node_not_found(db: Session) -> None:
    """Test getting a non-existent node"""
    random_id = uuid.uuid4()
    node = get_node(session=db, node_id=random_id)
    assert node is None


def test_update_node(db: Session) -> None:
    """Test updating a node"""
    node = create_random_node(db)
    
    new_name = "updated-node"
    new_status = "online"
    node_update = NodeUpdate(name=new_name, status=new_status)
    
    updated_node = update_node(session=db, db_node=node, node_in=node_update)
    
    assert updated_node.id == node.id
    assert updated_node.name == new_name
    assert updated_node.status == new_status
    assert updated_node.ip == node.ip  # unchanged


def test_update_node_partial(db: Session) -> None:
    """Test partial update of a node"""
    node = create_random_node(db)
    original_name = node.name
    
    node_update = NodeUpdate(status="online")
    updated_node = update_node(session=db, db_node=node, node_in=node_update)
    
    assert updated_node.status == "online"
    assert updated_node.name == original_name  # unchanged


def test_delete_node(db: Session) -> None:
    """Test deleting a node"""
    node = create_random_node(db)
    node_id = node.id
    
    delete_node(session=db, node_id=node_id)
    
    deleted_node = get_node(session=db, node_id=node_id)
    assert deleted_node is None


def test_delete_node_not_found(db: Session) -> None:
    """Test deleting a non-existent node (should not raise error)"""
    random_id = uuid.uuid4()
    # Should not raise an error
    delete_node(session=db, node_id=random_id)

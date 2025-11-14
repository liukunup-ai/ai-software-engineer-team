import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.node import create_random_node


def test_create_node(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    data = {"name": "node-a", "ip": "10.0.0.1", "description": "test node", "tags": "gpu,lab"}
    response = client.post(
        f"{settings.API_V1_STR}/nodes/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["ip"] == data["ip"]
    assert "id" in content


def test_read_nodes(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/nodes/", headers=superuser_token_headers
    )
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content


def test_read_node_not_found(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/nodes/{uuid.uuid4()}", headers=superuser_token_headers
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Node not found"


def test_permissions_denied_for_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/nodes/", headers=normal_user_token_headers
    )
    assert response.status_code in (200, 403)  # 根据当前实现返回空列表或403
    # 若是200，验证为空；若是403，验证权限信息
    if response.status_code == 200:
        content = response.json()
        assert content["count"] == 0
    else:
        content = response.json()
        assert content["detail"] == "Not enough permissions"


def test_update_node(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    # 先创建
    create_data = {"name": "node-b", "ip": "10.0.0.2"}
    create_resp = client.post(
        f"{settings.API_V1_STR}/nodes/",
        headers=superuser_token_headers,
        json=create_data,
    )
    node_id = create_resp.json()["id"]
    update_data = {"name": "node-b-updated", "status": "online"}
    update_resp = client.put(
        f"{settings.API_V1_STR}/nodes/{node_id}",
        headers=superuser_token_headers,
        json=update_data,
    )
    assert update_resp.status_code == 200
    content = update_resp.json()
    assert content["name"] == update_data["name"]
    assert content["status"] == update_data["status"]


def test_delete_node(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    create_data = {"name": "node-c", "ip": "10.0.0.3"}
    create_resp = client.post(
        f"{settings.API_V1_STR}/nodes/",
        headers=superuser_token_headers,
        json=create_data,
    )
    node_id = create_resp.json()["id"]
    del_resp = client.delete(
        f"{settings.API_V1_STR}/nodes/{node_id}", headers=superuser_token_headers
    )
    assert del_resp.status_code == 200
    content = del_resp.json()
    assert content["message"] == "Node deleted successfully"


def test_delete_node_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test deleting a non-existent node"""
    response = client.delete(
        f"{settings.API_V1_STR}/nodes/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Node not found"


def test_read_node(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test reading a specific node"""
    node = create_random_node(db)
    response = client.get(
        f"{settings.API_V1_STR}/nodes/{node.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == node.name
    assert content["ip"] == node.ip
    assert content["id"] == str(node.id)


def test_update_node_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test updating a non-existent node"""
    update_data = {"name": "updated-name"}
    response = client.put(
        f"{settings.API_V1_STR}/nodes/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=update_data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Node not found"


def test_create_node_with_minimal_data(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """Test creating a node with only required fields"""
    data = {"name": "minimal-node", "ip": "10.0.0.5"}
    response = client.post(
        f"{settings.API_V1_STR}/nodes/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["ip"] == data["ip"]
    assert content["status"] == "offline"  # default value


def test_update_node_partial(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test partial update of a node"""
    node = create_random_node(db)
    update_data = {"status": "online"}
    response = client.put(
        f"{settings.API_V1_STR}/nodes/{node.id}",
        headers=superuser_token_headers,
        json=update_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["status"] == "online"
    assert content["name"] == node.name  # unchanged
    assert content["ip"] == node.ip  # unchanged


def test_list_nodes_pagination(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    """Test node listing with pagination"""
    # Create multiple nodes
    for i in range(3):
        create_random_node(db)
    
    # Test with limit
    response = client.get(
        f"{settings.API_V1_STR}/nodes/?skip=0&limit=2",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) <= 2
    assert content["count"] >= 3


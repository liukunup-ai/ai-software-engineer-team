import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import Project


def test_create_project_with_repository_urls(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    data = {
        "name": "demo-project",
        "description": "project with repos",
        "repository_urls": [
            "https://github.com/example/awesome.git",
            "https://github.com/example/second/",
        ],
    }
    response = client.post(
        f"{settings.API_V1_STR}/projects/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    payload = response.json()
    project_id = payload["id"]

    project = db.get(Project, uuid.UUID(project_id))
    assert project is not None
    db.refresh(project)
    urls = sorted(repo.url for repo in project.repositories)
    assert urls == [
        "https://github.com/example/awesome.git",
        "https://github.com/example/second",
    ]


def test_update_project_repositories_replaces_existing(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_data = {
        "name": "repo-update",
        "description": "initial",
        "repository_urls": ["https://github.com/example/original"],
    }
    create_resp = client.post(
        f"{settings.API_V1_STR}/projects/",
        headers=superuser_token_headers,
        json=create_data,
    )
    assert create_resp.status_code == 200
    project_id = create_resp.json()["id"]

    update_data = {
        "repository_urls": [
            "https://github.com/example/new-one",
            "https://github.com/example/new-two/",
        ]
    }
    update_resp = client.put(
        f"{settings.API_V1_STR}/projects/{project_id}",
        headers=superuser_token_headers,
        json=update_data,
    )
    assert update_resp.status_code == 200

    project = db.get(Project, uuid.UUID(project_id))
    assert project is not None
    db.refresh(project)
    updated_urls = sorted(repo.url for repo in project.repositories)
    assert updated_urls == [
        "https://github.com/example/new-one",
        "https://github.com/example/new-two",
    ]


def test_normal_user_can_delete_own_project(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    superuser_token_headers: dict[str, str],
) -> None:
    create_resp = client.post(
        f"{settings.API_V1_STR}/projects/",
        headers=normal_user_token_headers,
        json={
            "name": "user-owned",
            "description": "owned by normal user",
        },
    )
    assert create_resp.status_code == 200
    project_id = create_resp.json()["id"]

    delete_resp = client.delete(
        f"{settings.API_V1_STR}/projects/{project_id}",
        headers=normal_user_token_headers,
    )
    assert delete_resp.status_code == 200
    assert delete_resp.json()["message"] == "Project deleted successfully"

    # ensure project really gone by attempting to fetch as superuser
    get_resp = client.get(
        f"{settings.API_V1_STR}/projects/{project_id}",
        headers=superuser_token_headers,
    )
    assert get_resp.status_code == 404
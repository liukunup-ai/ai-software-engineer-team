from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings


def test_get_registration_key(client: TestClient, superuser_token_headers: dict[str, str]):
    resp = client.get(f"{settings.API_V1_STR}/nodes/registration-key", headers=superuser_token_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert 'registration_key' in data
    assert 'docker_command' in data
    original_key = data['registration_key']

    # 旋转密钥
    rotate = client.post(f"{settings.API_V1_STR}/nodes/registration-key/rotate", headers=superuser_token_headers)
    assert rotate.status_code == 200
    rotated = rotate.json()
    assert rotated['registration_key'] != original_key
    assert rotated['registration_key'] in rotated['docker_command']

    # 再次获取确认使用新密钥
    resp2 = client.get(f"{settings.API_V1_STR}/nodes/registration-key", headers=superuser_token_headers)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2['registration_key'] == rotated['registration_key']

from __future__ import annotations


def test_update_profile_requires_auth(client):
    response = client.patch("/api/v1/users/me", json={"full_name": "Updated Name"})
    assert response.status_code == 401


def test_integrations_requires_auth(client):
    response = client.get("/api/v1/integrations")
    assert response.status_code == 401


def test_api_keys_requires_auth(client):
    response = client.get("/api/v1/api-keys")
    assert response.status_code == 401

from __future__ import annotations


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] in {"ok", "error"}


def test_health_ws_endpoint(client):
    response = client.get("/health/ws")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["component"] == "websocket"


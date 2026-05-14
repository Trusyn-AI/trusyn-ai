from __future__ import annotations


def test_ws_channels_reference_endpoint(client):
    response = client.get("/api/v1/ws/channels")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "/ws/platform" in body["data"]["paths"]


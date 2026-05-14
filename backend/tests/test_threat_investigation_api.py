from __future__ import annotations


def test_threat_investigation_requires_auth(client):
    response = client.get("/api/v1/threats/00000000-0000-0000-0000-000000000001/investigation")
    assert response.status_code == 401

from __future__ import annotations


def test_dashboard_summary_requires_auth(client):
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 401

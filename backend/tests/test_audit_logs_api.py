from __future__ import annotations


def test_list_audit_logs_requires_auth(client):
    response = client.get("/api/v1/audit-logs")
    assert response.status_code == 401


def test_get_audit_log_requires_auth(client):
    response = client.get("/api/v1/audit-logs/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 401

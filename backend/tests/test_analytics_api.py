from __future__ import annotations


ENDPOINTS = [
    "/api/v1/analytics/overview",
    "/api/v1/analytics/risk-trends",
    "/api/v1/analytics/decision-distribution",
    "/api/v1/analytics/agent-trust-trends",
    "/api/v1/analytics/policy-impact",
]


def test_analytics_endpoints_require_auth(client):
    for endpoint in ENDPOINTS:
        response = client.get(endpoint)
        assert response.status_code == 401

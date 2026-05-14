from __future__ import annotations

from typing import Any

from app.schemas.base import ORMModel


class IntelligenceAnomalyRecord(ORMModel):
    id: str
    organization_id: str
    agent_id: str
    anomaly_score: int
    anomaly_type: str
    confidence: int
    reasoning: str
    request_id: str | None = None
    timestamp: str


class IntelligenceTrustRecord(ORMModel):
    id: str
    organization_id: str
    agent_id: str
    trust_score: int
    trend: str
    delta: int
    reasoning: list[str]
    request_id: str | None = None
    timestamp: str


class IntelligenceCorrelationRecord(ORMModel):
    id: str
    organization_id: str
    agent_id: str
    decision_id: str
    correlation_id: str
    cluster_type: str
    confidence: int
    attack_chain: list[str]
    trend: str
    reasoning: str
    timestamp: str


class IntelligenceRecommendationRecord(ORMModel):
    id: str
    organization_id: str
    agent_id: str
    decision_id: str
    recommendations: list[str]
    rationale: str
    source: str
    timestamp: str


class IntelligenceExplainabilityRecord(ORMModel):
    decision_id: str
    organization_id: str
    agent_id: str
    summary: str
    factors: list[str]
    policy_explanations: list[str]
    trust_explanations: list[str]
    timestamp: str


class IntelligenceCollectionResponse(ORMModel):
    items: list[dict[str, Any]]
    total: int


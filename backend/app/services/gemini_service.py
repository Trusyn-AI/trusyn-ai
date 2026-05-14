from __future__ import annotations

import asyncio
import json
from collections import deque
from dataclasses import dataclass
from time import time
from typing import Any

from loguru import logger

from app.core.config import settings
from app.utils.resilience import CircuitBreaker, async_retry, with_timeout

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover - optional runtime dependency in local env
    genai = None


@dataclass(slots=True)
class GeminiAnalysisResult:
    threat_level: str
    recommendation: str
    reasoning: str


class GeminiService:
    """AI-assisted governance intelligence using Gemini with resilience controls."""

    def __init__(self) -> None:
        self._circuit = CircuitBreaker(
            failure_threshold=settings.gemini_circuit_fail_threshold,
            recovery_seconds=settings.gemini_circuit_recovery_seconds,
        )
        self._rate_lock = asyncio.Lock()
        self._rate_window: deque[float] = deque()
        self._concurrency_semaphore = asyncio.Semaphore(20)

    async def analyze_request(
        self,
        *,
        prompt: str,
        target_model: str,
        metadata: dict[str, Any],
        request_id: str | None,
    ) -> GeminiAnalysisResult | None:
        if not settings.gemini_api_key or genai is None:
            return None
        if self._circuit.is_open():
            logger.warning("gemini_circuit_open", request_id=request_id)
            return None

        within_limit = await self._check_rate_limit()
        if not within_limit:
            logger.warning("gemini_rate_limited", request_id=request_id)
            return None

        async def _runner() -> GeminiAnalysisResult | None:
            async with self._concurrency_semaphore:
                return await with_timeout(
                    asyncio.to_thread(self._analyze_sync, prompt, target_model, metadata, request_id),
                    timeout_seconds=settings.gemini_timeout_seconds,
                )

        try:
            result = await async_retry(
                _runner,
                attempts=max(1, settings.gemini_retry_attempts),
                backoff_seconds=max(0.05, settings.gemini_retry_backoff_seconds),
            )
            self._circuit.record_success()
            return result
        except Exception as exc:  # pragma: no cover - network/runtime dependent
            self._circuit.record_failure()
            logger.warning("gemini_analysis_failed", request_id=request_id, error=str(exc))
            return None

    async def _check_rate_limit(self) -> bool:
        now = time()
        window_seconds = settings.rate_limit_window_seconds
        async with self._rate_lock:
            while self._rate_window and (now - self._rate_window[0]) >= window_seconds:
                self._rate_window.popleft()
            if len(self._rate_window) >= settings.gemini_rate_limit_per_window:
                return False
            self._rate_window.append(now)
            return True

    def _analyze_sync(
        self,
        prompt: str,
        target_model: str,
        metadata: dict[str, Any],
        request_id: str | None,
    ) -> GeminiAnalysisResult | None:
        genai.configure(api_key=settings.gemini_api_key)

        model_name = target_model if target_model.startswith("gemini") else "gemini-1.5-flash"
        model = genai.GenerativeModel(model_name=model_name)

        instruction = (
            "You are a governance risk classifier for enterprise AI requests. "
            "Analyze the request and return strict JSON with keys: "
            "threat_level (LOW/MEDIUM/HIGH/CRITICAL), recommendation (ALLOW/BLOCK/REVIEW/QUARANTINE/RATE_LIMIT), reasoning."
        )
        response = model.generate_content(
            f"{instruction}\n\n"
            f"request_id: {request_id}\n"
            f"target_model: {target_model}\n"
            f"metadata: {json.dumps(metadata, ensure_ascii=True)}\n"
            f"prompt: {prompt}\n"
        )

        text = getattr(response, "text", "") or ""
        parsed = self._extract_json(text)
        if not parsed:
            return None

        return GeminiAnalysisResult(
            threat_level=str(parsed.get("threat_level", "")).upper() or "MEDIUM",
            recommendation=str(parsed.get("recommendation", "")).upper() or "REVIEW",
            reasoning=str(parsed.get("reasoning", "")).strip() or "Gemini analysis result.",
        )

    def _extract_json(self, text: str) -> dict[str, Any] | None:
        text = text.strip()
        if not text:
            return None

        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:].strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start >= 0 and end > start:
                try:
                    return json.loads(text[start : end + 1])
                except json.JSONDecodeError:
                    return None
        return None

    async def generate_governance_recommendations(self, *, context: dict[str, Any]) -> list[str] | None:
        prompt = (
            "Generate enterprise governance recommendations for this runtime security context. "
            "Return strict JSON: {\"recommendations\": [\"...\"]} with 3-6 actionable items.\n\n"
            f"context={json.dumps(context, ensure_ascii=True)}"
        )
        payload = await self._structured_json_call(prompt, request_id=str(context.get("request_id", "")))
        if not payload:
            return None
        recommendations = payload.get("recommendations")
        if isinstance(recommendations, list):
            return [str(item).strip() for item in recommendations if str(item).strip()]
        return None

    async def generate_explainability_summary(self, *, context: dict[str, Any]) -> dict[str, Any] | None:
        prompt = (
            "Create governance explainability summary. "
            "Return strict JSON with keys: summary (string), factors (array of strings).\n\n"
            f"context={json.dumps(context, ensure_ascii=True)}"
        )
        return await self._structured_json_call(prompt, request_id=str(context.get("request_id", "")))

    async def analyze_behavioral_reasoning(self, *, context: dict[str, Any]) -> dict[str, Any] | None:
        prompt = (
            "Assess behavioral anomaly and trust drift likelihood from runtime context. "
            "Return JSON with keys: anomaly_signal (LOW/MEDIUM/HIGH), reasoning (string).\n\n"
            f"context={json.dumps(context, ensure_ascii=True)}"
        )
        return await self._structured_json_call(prompt, request_id=str(context.get("request_id", "")))

    async def analyze_threat_correlation(self, *, context: dict[str, Any]) -> dict[str, Any] | None:
        prompt = (
            "Analyze whether threats indicate correlated attack chain. "
            "Return JSON with keys: correlated (bool), chain (array), reasoning (string).\n\n"
            f"context={json.dumps(context, ensure_ascii=True)}"
        )
        return await self._structured_json_call(prompt, request_id=str(context.get("request_id", "")))

    async def explain_trust_reasoning(self, *, context: dict[str, Any]) -> dict[str, Any] | None:
        prompt = (
            "Explain trust score change for enterprise AI governance. "
            "Return JSON with keys: summary (string), factors (array of strings).\n\n"
            f"context={json.dumps(context, ensure_ascii=True)}"
        )
        return await self._structured_json_call(prompt, request_id=str(context.get("request_id", "")))

    async def _structured_json_call(self, prompt: str, *, request_id: str | None) -> dict[str, Any] | None:
        if not settings.gemini_api_key or genai is None:
            return None
        if self._circuit.is_open():
            return None
        within_limit = await self._check_rate_limit()
        if not within_limit:
            return None

        async def _runner() -> dict[str, Any] | None:
            async with self._concurrency_semaphore:
                return await with_timeout(
                    asyncio.to_thread(self._structured_sync, prompt, request_id),
                    timeout_seconds=settings.gemini_timeout_seconds,
                )

        try:
            result = await async_retry(
                _runner,
                attempts=max(1, settings.gemini_retry_attempts),
                backoff_seconds=max(0.05, settings.gemini_retry_backoff_seconds),
            )
            self._circuit.record_success()
            return result
        except Exception as exc:  # pragma: no cover
            self._circuit.record_failure()
            logger.warning("gemini_structured_call_failed", request_id=request_id, error=str(exc))
            return None

    def _structured_sync(self, prompt: str, request_id: str | None) -> dict[str, Any] | None:
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = getattr(response, "text", "") or ""
        parsed = self._extract_json(text)
        if not parsed:
            logger.debug("gemini_structured_parse_failed", request_id=request_id)
            return None
        return parsed

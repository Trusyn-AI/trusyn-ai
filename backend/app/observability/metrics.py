from __future__ import annotations

import asyncio
from collections import defaultdict, deque
from statistics import mean
from typing import Any


class MetricsRegistry:
    """In-memory metrics registry with Prometheus-compatible rendering."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._counters: dict[str, int] = defaultdict(int)
        self._gauges: dict[str, float] = defaultdict(float)
        self._histograms: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=1000))

    async def increment(self, metric: str, value: int = 1) -> None:
        async with self._lock:
            self._counters[metric] += value

    async def set_gauge(self, metric: str, value: float) -> None:
        async with self._lock:
            self._gauges[metric] = value

    async def observe(self, metric: str, value: float) -> None:
        async with self._lock:
            self._histograms[metric].append(value)

    async def snapshot(self) -> dict[str, Any]:
        async with self._lock:
            return {
                "counters": dict(self._counters),
                "gauges": dict(self._gauges),
                "histograms": {name: list(values) for name, values in self._histograms.items()},
            }

    async def prometheus_text(self) -> str:
        """Render metrics in a Prometheus-compatible exposition format."""
        lines: list[str] = []
        async with self._lock:
            for metric, value in sorted(self._counters.items()):
                metric_name = _normalize_metric_name(metric)
                lines.append(f"# TYPE {metric_name} counter")
                lines.append(f"{metric_name} {value}")

            for metric, value in sorted(self._gauges.items()):
                metric_name = _normalize_metric_name(metric)
                lines.append(f"# TYPE {metric_name} gauge")
                lines.append(f"{metric_name} {value}")

            for metric, values in sorted(self._histograms.items()):
                metric_name = _normalize_metric_name(metric)
                collection = list(values)
                if not collection:
                    continue
                lines.append(f"# TYPE {metric_name} summary")
                lines.append(f"{metric_name}_count {len(collection)}")
                lines.append(f"{metric_name}_sum {sum(collection)}")
                lines.append(f"{metric_name}_avg {mean(collection)}")
                lines.append(f"{metric_name}_max {max(collection)}")

        return "\n".join(lines) + ("\n" if lines else "")


def _normalize_metric_name(metric: str) -> str:
    safe = metric.replace(".", "_").replace("-", "_").replace("/", "_")
    return f"trusyn_{safe}"


metrics_registry = MetricsRegistry()


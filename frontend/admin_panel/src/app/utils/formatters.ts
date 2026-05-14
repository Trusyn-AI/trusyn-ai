export function toRelativeTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function normalizeSeverity(
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
): "low" | "medium" | "high" | "critical" {
  return severity.toLowerCase() as "low" | "medium" | "high" | "critical";
}

export function normalizeDecision(
  decision: "ALLOW" | "BLOCK" | "REVIEW" | "QUARANTINE" | "RATE_LIMIT",
): "allowed" | "blocked" | "review" {
  if (decision === "ALLOW") return "allowed";
  if (decision === "REVIEW") return "review";
  return "blocked";
}

export function normalizeAgentStatus(
  status: "OPERATIONAL" | "WARNING" | "QUARANTINED" | "BLOCKED",
): "operational" | "warning" | "quarantined" | "blocked" {
  return status.toLowerCase() as "operational" | "warning" | "quarantined" | "blocked";
}


export function getSeverityBgColor(
  severity: "low" | "medium" | "high" | "critical",
): string {
  const colors = {
    low: "bg-blue-500/10 border-blue-500/20",
    medium: "bg-yellow-500/10 border-yellow-500/20",
    high: "bg-orange-500/10 border-orange-500/20",
    critical: "bg-red-500/10 border-red-500/20",
  };
  return colors[severity];
}

export function getStatusBgColor(
  status: "operational" | "warning" | "quarantined" | "blocked",
): string {
  const colors = {
    operational: "bg-green-500/10 border-green-500/20",
    warning: "bg-yellow-500/10 border-yellow-500/20",
    quarantined: "bg-orange-500/10 border-orange-500/20",
    blocked: "bg-red-500/10 border-red-500/20",
  };
  return colors[status];
}


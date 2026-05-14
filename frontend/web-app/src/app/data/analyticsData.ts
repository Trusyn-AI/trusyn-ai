// ── Analytics data for Phase 6 ────────────────────────────────────────────────

export type DateRange = '7d' | '30d' | '90d';

// ── 90-day risk evolution (daily) ────────────────────────────────────────────
function mkDay(daysAgo: number, low: number, med: number, high: number, crit: number) {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    low, medium: med, high, critical: crit,
    total: low + med + high + crit,
  };
}

export const riskEvolution90d = [
  mkDay(89,28,8,2,0), mkDay(88,31,9,3,1), mkDay(87,25,7,2,0), mkDay(86,34,11,4,1),
  mkDay(85,29,9,3,0), mkDay(84,22,6,2,0), mkDay(83,18,5,1,0), // wknd
  mkDay(82,35,12,4,1), mkDay(81,38,13,5,2), mkDay(80,32,10,4,1), mkDay(79,40,14,6,2),
  mkDay(78,36,11,4,1), mkDay(77,27,8,3,0), mkDay(76,20,6,2,0), // wknd
  mkDay(75,42,15,6,2), mkDay(74,45,16,7,3), mkDay(73,39,13,5,2), mkDay(72,48,17,8,3),
  mkDay(71,44,15,7,2), mkDay(70,33,10,4,1), mkDay(69,24,7,2,0), // wknd
  mkDay(68,50,18,8,3), mkDay(67,47,16,7,2), mkDay(66,43,15,6,2), mkDay(65,52,19,9,4),
  mkDay(64,49,17,8,3), mkDay(63,38,12,5,1), mkDay(62,27,8,3,0), // wknd
  // ── 4-wk mark: Finance Agent starts drifting ──────────────────────────────
  mkDay(61,55,22,10,4), mkDay(60,58,24,11,5), mkDay(59,52,20,9,4), mkDay(58,61,26,13,6),
  mkDay(57,57,23,11,5), mkDay(56,44,16,7,2), mkDay(55,31,10,4,1), // wknd
  mkDay(54,63,27,14,6), mkDay(53,60,25,12,5), mkDay(52,55,22,10,4), mkDay(51,66,29,15,7),
  mkDay(50,62,26,13,6), mkDay(49,48,18,8,3), mkDay(48,34,12,5,1), // wknd
  // ── 6-wk: Ops Agent quarantine event spike ────────────────────────────────
  mkDay(47,58,23,12,5), mkDay(46,62,27,14,7), mkDay(45,55,22,11,5), mkDay(44,70,31,17,8),
  mkDay(43,65,28,15,7), mkDay(42,50,20,10,4), mkDay(41,37,13,6,2), // wknd
  mkDay(40,67,28,15,7), mkDay(39,64,26,13,6), mkDay(38,59,24,12,5), mkDay(37,72,32,18,8),
  mkDay(36,68,29,16,7), mkDay(35,53,21,11,4), mkDay(34,40,14,7,2), // wknd
  // ── 8-wk: Governance catches up, blocks increase ─────────────────────────
  mkDay(33,60,24,13,5), mkDay(32,56,22,11,4), mkDay(31,51,20,10,4), mkDay(30,65,27,14,6),
  mkDay(29,61,25,12,5), mkDay(28,47,18,9,3), mkDay(27,33,11,5,1), // wknd
  mkDay(26,58,23,11,4), mkDay(25,55,21,10,4), mkDay(24,50,19,9,3), mkDay(23,63,26,13,5),
  mkDay(22,59,24,11,4), mkDay(21,45,17,8,2), mkDay(20,31,10,4,1), // wknd
  // ── last 3 weeks: stable with spikes ─────────────────────────────────────
  mkDay(19,52,20,10,3), mkDay(18,55,22,11,4), mkDay(17,48,19,9,3), mkDay(16,58,23,12,4),
  mkDay(15,54,21,10,3), mkDay(14,41,15,7,2), mkDay(13,28,9,4,1), // wknd
  mkDay(12,50,19,9,3), mkDay(11,47,18,8,2), mkDay(10,43,16,8,3), mkDay(9,55,22,11,4),
  mkDay(8,51,20,10,3), mkDay(7,39,14,6,2), mkDay(6,27,9,4,1), // wknd
  mkDay(5,46,18,9,3), mkDay(4,43,17,8,2), mkDay(3,40,15,7,2), mkDay(2,50,20,10,3),
  mkDay(1,47,18,9,2), mkDay(0,35,13,6,2),
];

export function sliceByRange(range: DateRange) {
  const n = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return riskEvolution90d.slice(-n);
}

// ── Trust score weekly history (12 weeks) ────────────────────────────────────
export const trustHistory = Array.from({ length: 13 }, (_, i) => {
  const w = 12 - i;
  return {
    week: w === 0 ? 'Now' : `W-${w}`,
    finance:    Math.max(45, Math.min(95, 78 - w * 1.3 + Math.sin(w) * 3)),
    hr:         Math.max(55, Math.min(99, 85 + w * 0.25 + Math.cos(w) * 2)),
    operations: Math.max(50, Math.min(95, 80 - w * 0.5 + Math.sin(w * 1.3) * 4)),
    support:    Math.max(60, Math.min(99, 89 + w * 0.17 + Math.cos(w * 0.8) * 1.5)),
  };
}).map(r => ({
  ...r,
  finance:    Math.round(r.finance),
  hr:         Math.round(r.hr),
  operations: Math.round(r.operations),
  support:    Math.round(r.support),
}));

// ── Policy trigger counts ─────────────────────────────────────────────────────
export const policyStats = [
  { id: 'FIN-001', name: 'Payroll Data Perimeter Guard',    triggers: 47, blocked: 44, warned: 3,  color: '#EF4444' },
  { id: 'DLP-001', name: 'PII External Transfer Block',     triggers: 38, blocked: 35, warned: 3,  color: '#EF4444' },
  { id: 'SEC-001', name: 'Prompt Injection Detection',      triggers: 12, blocked: 12, warned: 0,  color: '#EC4899' },
  { id: 'OPS-001', name: 'Production Environment Guard',    triggers: 29, blocked: 0,  warned: 29, color: '#8B3CF7' },
  { id: 'HR-001',  name: 'Data Minimization Principle',     triggers: 24, blocked: 0,  warned: 24, color: '#8B3CF7' },
  { id: 'NET-001', name: 'Approved Integration Registry',   triggers: 31, blocked: 28, warned: 3,  color: '#EF4444' },
  { id: 'DLP-002', name: 'Bulk Export Volume Limit',        triggers: 19, blocked: 0,  warned: 19, color: '#F59E0B' },
  { id: 'FIN-002', name: 'Off-Hours Finance Activity',      triggers: 22, blocked: 0,  warned: 22, color: '#F59E0B' },
  { id: 'OPS-002', name: 'Change Window Enforcement',       triggers: 18, blocked: 0,  warned: 18, color: '#F59E0B' },
  { id: 'HR-002',  name: 'Terminated Employee Retention',   triggers: 9,  blocked: 9,  warned: 0,  color: '#EF4444' },
  { id: 'NET-002', name: 'DNS Reputation Check',            triggers: 14, blocked: 7,  warned: 7,  color: '#F59E0B' },
  { id: 'SEC-002', name: 'Agent Self-Modification Block',   triggers: 3,  blocked: 3,  warned: 0,  color: '#EC4899' },
  { id: 'CUST-001',name: 'Customer PII Minimum Access',     triggers: 16, blocked: 0,  warned: 16, color: '#F59E0B' },
];

// ── Threat type distribution ──────────────────────────────────────────────────
export const threatTypes = [
  { type: 'Prompt Injection',   count: 12, color: '#EC4899', pct: 24  },
  { type: 'Data Exfiltration',  count: 18, color: '#EF4444', pct: 36  },
  { type: 'Policy Violation',   count: 9,  color: '#8B3CF7', pct: 18  },
  { type: 'Unauthorized API',   count: 7,  color: '#F59E0B', pct: 14  },
  { type: 'Suspicious Behavior',count: 4,  color: '#38BDF8', pct: 8   },
];

// ── Agent behavioral radar (5 dimensions, 0-100) ─────────────────────────────
export const agentRadar = [
  { axis: 'Risk Mgmt',    finance: 55, hr: 88, operations: 70, support: 92 },
  { axis: 'Compliance',   finance: 60, hr: 91, operations: 72, support: 90 },
  { axis: 'Data Safety',  finance: 52, hr: 85, operations: 68, support: 94 },
  { axis: 'Stability',    finance: 70, hr: 86, operations: 65, support: 95 },
  { axis: 'Efficiency',   finance: 82, hr: 78, operations: 88, support: 85 },
];

// ── Risk forecast (14 actual + 7 projected) ───────────────────────────────────
export const riskForecast = [
  ...Array.from({ length: 14 }, (_, i) => {
    const daysAgo = 13 - i;
    const base = 12 + Math.sin(i * 0.8) * 3 + i * 0.2;
    return {
      day: new Date(Date.now() - daysAgo * 86400000)
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: Math.round(base * 10) / 10,
      projected: null as number | null,
      upper: null as number | null,
      lower: null as number | null,
      isFuture: false,
    };
  }),
  ...Array.from({ length: 8 }, (_, i) => {
    const daysAhead = i + 1;
    const base = 15.2 + i * 0.35 + Math.sin(i * 0.6) * 1.2;
    return {
      day: new Date(Date.now() + daysAhead * 86400000)
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: null as number | null,
      projected: Math.round(base * 10) / 10,
      upper: Math.round((base + 2 + i * 0.15) * 10) / 10,
      lower: Math.round((base - 2 - i * 0.15) * 10) / 10,
      isFuture: true,
    };
  }),
];

// ── Per-agent KPIs ────────────────────────────────────────────────────────────
export const agentKpis = [
  {
    name: 'Finance Agent', icon: '💰', color: '#8B3CF7',
    events: 847, blocked: 89, trustScore: 62, blockRate: 10.5,
    trend: -8.3, trustTrend: -16, topRisk: 'Data Exfiltration',
  },
  {
    name: 'HR Agent', icon: '👥', color: '#10B981',
    events: 512, blocked: 24, trustScore: 88, blockRate: 4.7,
    trend: +2.1, trustTrend: +3, topRisk: 'Bulk Data Access',
  },
  {
    name: 'Operations Agent', icon: '⚙️', color: '#F59E0B',
    events: 731, blocked: 67, trustScore: 74, blockRate: 9.2,
    trend: -4.7, trustTrend: -6, topRisk: 'Prompt Injection',
  },
  {
    name: 'Support Agent', icon: '🎧', color: '#38BDF8',
    events: 1203, blocked: 0,  trustScore: 91, blockRate: 0.0,
    trend: +5.8, trustTrend: +2, topRisk: 'PII Over-Access',
  },
];

// ── Governance latency breakdown ──────────────────────────────────────────────
export const latencyBreakdown = [
  { label: 'Policy Eval',   ms: 2.1, color: '#8B3CF7' },
  { label: 'Risk Score',    ms: 1.8, color: '#38BDF8' },
  { label: 'DLP Scan',      ms: 3.2, color: '#10B981' },
  { label: 'Decision Exec', ms: 0.9, color: '#F59E0B' },
  { label: 'Audit Log',     ms: 0.4, color: '#EC4899' },
];

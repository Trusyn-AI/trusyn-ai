export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Decision = 'ALLOW' | 'WARNING' | 'BLOCK' | 'QUARANTINE' | 'REQUIRE_APPROVAL';
export type AgentName = 'Finance Agent' | 'HR Agent' | 'Operations Agent' | 'Support Agent';

export interface AgentEvent {
  id: string;
  agent: AgentName;
  action: string;
  resource: string;
  targetSystem: string;
  risk: RiskLevel;
  decision: Decision;
  timestamp: Date;
  details: string;
}

export interface ThreatAlert {
  id: string;
  type: string;
  agent: AgentName;
  severity: RiskLevel;
  description: string;
  timestamp: Date;
  resolved: boolean;
}

export interface AgentInfo {
  id: string;
  name: AgentName;
  status: 'active' | 'idle' | 'blocked';
  currentTask: string;
  trustScore: number;
  eventsToday: number;
  blockedToday: number;
  riskLevel: RiskLevel;
  icon: string;
}

export const agentInfos: AgentInfo[] = [
  {
    id: 'a1',
    name: 'Finance Agent',
    status: 'active',
    currentTask: 'Reconciling quarterly reports',
    trustScore: 62,
    eventsToday: 34,
    blockedToday: 5,
    riskLevel: 'HIGH',
    icon: '💰',
  },
  {
    id: 'a2',
    name: 'HR Agent',
    status: 'active',
    currentTask: 'Processing onboarding workflows',
    trustScore: 88,
    eventsToday: 19,
    blockedToday: 1,
    riskLevel: 'LOW',
    icon: '👥',
  },
  {
    id: 'a3',
    name: 'Operations Agent',
    status: 'active',
    currentTask: 'Monitoring vendor API connections',
    trustScore: 74,
    eventsToday: 27,
    blockedToday: 3,
    riskLevel: 'MEDIUM',
    icon: '⚙️',
  },
  {
    id: 'a4',
    name: 'Support Agent',
    status: 'active',
    currentTask: 'Handling customer escalations',
    trustScore: 91,
    eventsToday: 52,
    blockedToday: 0,
    riskLevel: 'LOW',
    icon: '🎧',
  },
];

export const initialEvents: AgentEvent[] = [
  {
    id: 'e1',
    agent: 'Finance Agent',
    action: 'Export payroll data to S3',
    resource: 'payroll_database',
    targetSystem: 'External S3 Bucket',
    risk: 'CRITICAL',
    decision: 'BLOCK',
    timestamp: new Date(Date.now() - 18000),
    details: 'Attempted to exfiltrate sensitive payroll records to an external cloud storage endpoint. Policy: Finance data cannot leave company perimeter.',
  },
  {
    id: 'e2',
    agent: 'Support Agent',
    action: 'Send follow-up email to customer',
    resource: 'email_service',
    targetSystem: 'SendGrid API',
    risk: 'LOW',
    decision: 'ALLOW',
    timestamp: new Date(Date.now() - 42000),
    details: 'Routine customer communication via approved email provider. No sensitive data detected.',
  },
  {
    id: 'e3',
    agent: 'Operations Agent',
    action: 'Call third-party vendor API',
    resource: 'vendor_endpoint',
    targetSystem: 'External REST API',
    risk: 'MEDIUM',
    decision: 'WARNING',
    timestamp: new Date(Date.now() - 75000),
    details: 'External API call detected. Vendor not in approved whitelist. Flagged for review.',
  },
  {
    id: 'e4',
    agent: 'HR Agent',
    action: 'Bulk access employee records',
    resource: 'hr_database',
    targetSystem: 'HR System',
    risk: 'HIGH',
    decision: 'REQUIRE_APPROVAL',
    timestamp: new Date(Date.now() - 130000),
    details: 'Bulk record retrieval exceeds normal operational threshold. Requires admin approval before proceeding.',
  },
  {
    id: 'e5',
    agent: 'Finance Agent',
    action: 'Generate Q2 financial summary',
    resource: 'finance_db',
    targetSystem: 'Internal Storage',
    risk: 'LOW',
    decision: 'ALLOW',
    timestamp: new Date(Date.now() - 195000),
    details: 'Standard report generation within company systems. No policy violations detected.',
  },
  {
    id: 'e6',
    agent: 'Operations Agent',
    action: 'Inject config into production',
    resource: 'prod_config',
    targetSystem: 'Production Environment',
    risk: 'CRITICAL',
    decision: 'QUARANTINE',
    timestamp: new Date(Date.now() - 260000),
    details: 'Prompt injection pattern detected in config payload. Agent quarantined pending investigation.',
  },
  {
    id: 'e7',
    agent: 'HR Agent',
    action: 'Schedule onboarding meeting',
    resource: 'calendar_api',
    targetSystem: 'Google Calendar',
    risk: 'LOW',
    decision: 'ALLOW',
    timestamp: new Date(Date.now() - 320000),
    details: 'Standard calendar operation using approved integration.',
  },
  {
    id: 'e8',
    agent: 'Support Agent',
    action: 'Access customer PII data',
    resource: 'customer_db',
    targetSystem: 'CRM System',
    risk: 'HIGH',
    decision: 'WARNING',
    timestamp: new Date(Date.now() - 410000),
    details: 'Accessed customer PII fields beyond scope of current ticket. Flagged for compliance review.',
  },
];

export const initialThreats: ThreatAlert[] = [
  {
    id: 't1',
    type: 'Prompt Injection',
    agent: 'Operations Agent',
    severity: 'CRITICAL',
    description: 'Malicious instruction embedded in vendor response payload attempting to override agent constraints.',
    timestamp: new Date(Date.now() - 260000),
    resolved: false,
  },
  {
    id: 't2',
    type: 'Data Exfiltration',
    agent: 'Finance Agent',
    severity: 'CRITICAL',
    description: 'Attempted export of payroll records to unauthorized external destination.',
    timestamp: new Date(Date.now() - 18000),
    resolved: false,
  },
  {
    id: 't3',
    type: 'Policy Violation',
    agent: 'HR Agent',
    severity: 'HIGH',
    description: 'Bulk access to employee records exceeds permitted threshold without authorization.',
    timestamp: new Date(Date.now() - 130000),
    resolved: false,
  },
  {
    id: 't4',
    type: 'Suspicious Behavior',
    agent: 'Support Agent',
    severity: 'MEDIUM',
    description: 'Agent accessed PII fields outside the scope of the assigned support ticket.',
    timestamp: new Date(Date.now() - 410000),
    resolved: false,
  },
  {
    id: 't5',
    type: 'Unauthorized API',
    agent: 'Operations Agent',
    severity: 'MEDIUM',
    description: 'Attempted connection to non-whitelisted external endpoint.',
    timestamp: new Date(Date.now() - 75000),
    resolved: true,
  },
];

export const riskTrendData = [
  { time: '00:00', low: 8, medium: 3, high: 1, critical: 0 },
  { time: '02:00', low: 5, medium: 2, high: 0, critical: 0 },
  { time: '04:00', low: 3, medium: 1, high: 0, critical: 0 },
  { time: '06:00', low: 12, medium: 4, high: 2, critical: 1 },
  { time: '08:00', low: 22, medium: 8, high: 3, critical: 1 },
  { time: '10:00', low: 31, medium: 11, high: 5, critical: 2 },
  { time: '12:00', low: 28, medium: 9, high: 4, critical: 1 },
  { time: '14:00', low: 35, medium: 14, high: 6, critical: 3 },
  { time: '16:00', low: 29, medium: 10, high: 4, critical: 2 },
  { time: '18:00', low: 18, medium: 7, high: 2, critical: 1 },
  { time: '20:00', low: 14, medium: 5, high: 2, critical: 0 },
  { time: 'Now', low: 11, medium: 4, high: 3, critical: 2 },
];

export const decisionDistData = [
  { name: 'ALLOW', value: 142, color: '#10B981' },
  { name: 'WARNING', value: 38, color: '#F59E0B' },
  { name: 'BLOCK', value: 24, color: '#EF4444' },
  { name: 'REQUIRE APPR.', value: 11, color: '#8B3CF7' },
  { name: 'QUARANTINE', value: 4, color: '#EC4899' },
];

const randomActions: { agent: AgentName; action: string; resource: string; targetSystem: string; risk: RiskLevel; decision: Decision; details: string }[] = [
  { agent: 'Finance Agent', action: 'Query payroll ledger', resource: 'payroll_db', targetSystem: 'Internal DB', risk: 'MEDIUM', decision: 'WARNING', details: 'Frequent query pattern detected outside business hours.' },
  { agent: 'Support Agent', action: 'Send bulk notifications', resource: 'notification_svc', targetSystem: 'SendGrid', risk: 'LOW', decision: 'ALLOW', details: 'Bulk email within approved limits.' },
  { agent: 'HR Agent', action: 'Update salary records', resource: 'hr_db', targetSystem: 'HR System', risk: 'HIGH', decision: 'REQUIRE_APPROVAL', details: 'Salary modification requires dual approval.' },
  { agent: 'Operations Agent', action: 'Restart service pod', resource: 'k8s_cluster', targetSystem: 'Production K8s', risk: 'MEDIUM', decision: 'WARNING', details: 'Pod restart in production flagged for review.' },
  { agent: 'Finance Agent', action: 'Run expense report', resource: 'expense_db', targetSystem: 'Internal Storage', risk: 'LOW', decision: 'ALLOW', details: 'Standard report within scope.' },
  { agent: 'Support Agent', action: 'Access ticket history', resource: 'crm_system', targetSystem: 'CRM', risk: 'LOW', decision: 'ALLOW', details: 'Normal ticket lookup.' },
  { agent: 'Operations Agent', action: 'Fetch external data feed', resource: 'market_api', targetSystem: 'Bloomberg API', risk: 'CRITICAL', decision: 'BLOCK', details: 'Unauthorized external financial data feed access blocked.' },
  { agent: 'HR Agent', action: 'Export org chart', resource: 'hr_db', targetSystem: 'SharePoint', risk: 'MEDIUM', decision: 'WARNING', details: 'Org chart export to external SharePoint flagged.' },
];

let eventCounter = 100;
export function generateRandomEvent(): AgentEvent {
  const template = randomActions[Math.floor(Math.random() * randomActions.length)];
  return {
    id: `e${++eventCounter}`,
    ...template,
    timestamp: new Date(),
  };
}

const randomThreats: { type: string; agent: AgentName; severity: RiskLevel; description: string }[] = [
  { type: 'Prompt Injection', agent: 'Finance Agent', severity: 'CRITICAL', description: 'Adversarial instruction detected in tool response attempting to bypass governance rules.' },
  { type: 'Data Leakage', agent: 'HR Agent', severity: 'HIGH', description: 'Sensitive employee data detected in outbound request payload.' },
  { type: 'Anomalous Access', agent: 'Operations Agent', severity: 'MEDIUM', description: 'Access pattern deviates significantly from baseline behavior model.' },
  { type: 'Policy Bypass', agent: 'Support Agent', severity: 'HIGH', description: 'Agent attempted to circumvent data minimization policy via indirect access path.' },
];

let threatCounter = 100;
export function generateRandomThreat(): ThreatAlert {
  const template = randomThreats[Math.floor(Math.random() * randomThreats.length)];
  return {
    id: `t${++threatCounter}`,
    ...template,
    timestamp: new Date(),
    resolved: false,
  };
}

// ── Agent-specific timeline events ──────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  type: 'action' | 'block' | 'warning' | 'approval' | 'quarantine';
  description: string;
  detail: string;
  risk: RiskLevel;
  decision: Decision;
  timestamp: Date;
}

const buildTimeline = (
  items: { type: TimelineEvent['type']; desc: string; detail: string; risk: RiskLevel; decision: Decision; minsAgo: number }[],
  prefix: string
): TimelineEvent[] =>
  items.map((item, i) => ({
    id: `${prefix}-tl-${i}`,
    type: item.type,
    description: item.desc,
    detail: item.detail,
    risk: item.risk,
    decision: item.decision,
    timestamp: new Date(Date.now() - item.minsAgo * 60 * 1000),
  }));

export const agentTimelines: Record<string, TimelineEvent[]> = {
  a1: buildTimeline(
    [
      { type: 'block',     desc: 'Export payroll data to S3',         detail: 'Attempted to exfiltrate employee payroll records to an unapproved external S3 bucket.',            risk: 'CRITICAL', decision: 'BLOCK',            minsAgo: 5  },
      { type: 'warning',   desc: 'Query payroll table at 02:14 AM',   detail: 'Off-hours DB query detected on payroll_ledger. Frequency exceeds normal baseline.',               risk: 'HIGH',     decision: 'WARNING',          minsAgo: 28 },
      { type: 'action',    desc: 'Generate Q2 financial summary',      detail: 'Routine report generation scoped to internal storage. No violations.',                            risk: 'LOW',      decision: 'ALLOW',            minsAgo: 55 },
      { type: 'approval',  desc: 'Modify vendor payment schedule',     detail: 'Payment schedule change requires dual CFO approval before execution.',                            risk: 'HIGH',     decision: 'REQUIRE_APPROVAL', minsAgo: 92 },
      { type: 'action',    desc: 'Reconcile bank statements',          detail: 'Standard reconciliation task within approved scope.',                                             risk: 'LOW',      decision: 'ALLOW',            minsAgo: 140 },
      { type: 'warning',   desc: 'Access external FX rate API',        detail: 'External API not in approved integration list. Connection allowed with flag.',                    risk: 'MEDIUM',   decision: 'WARNING',          minsAgo: 200 },
      { type: 'action',    desc: 'Draft expense report',               detail: 'Expense report scoped to internal finance system only.',                                          risk: 'LOW',      decision: 'ALLOW',            minsAgo: 260 },
      { type: 'block',     desc: 'Send salary data via email',         detail: 'Outbound email containing salary data to external address blocked by DLP policy.',               risk: 'CRITICAL', decision: 'BLOCK',            minsAgo: 320 },
    ],
    'fa'
  ),
  a2: buildTimeline(
    [
      { type: 'approval',  desc: 'Bulk update salary bands',           detail: 'Modification of salary bands for 200+ employees requires CHRO sign-off.',                        risk: 'HIGH',     decision: 'REQUIRE_APPROVAL', minsAgo: 12 },
      { type: 'action',    desc: 'Schedule onboarding meetings',       detail: 'Calendar invites via approved Google Calendar integration.',                                      risk: 'LOW',      decision: 'ALLOW',            minsAgo: 35 },
      { type: 'action',    desc: 'Generate offer letter draft',        detail: 'Template-based offer letter for candidate. No sensitive data in transit.',                        risk: 'LOW',      decision: 'ALLOW',            minsAgo: 70 },
      { type: 'warning',   desc: 'Export org chart to SharePoint',     detail: 'SharePoint destination is external-facing. Org structure data flagged.',                         risk: 'MEDIUM',   decision: 'WARNING',          minsAgo: 110 },
      { type: 'action',    desc: 'Pull open requisitions list',        detail: 'Internal ATS query, normal operational scope.',                                                   risk: 'LOW',      decision: 'ALLOW',            minsAgo: 150 },
      { type: 'action',    desc: 'Send benefits enrollment reminder',  detail: 'Internal communication via approved email service.',                                              risk: 'LOW',      decision: 'ALLOW',            minsAgo: 200 },
      { type: 'warning',   desc: 'Access terminated employee records', detail: 'Querying records of terminated employees outside retention policy window.',                      risk: 'MEDIUM',   decision: 'WARNING',          minsAgo: 260 },
      { type: 'action',    desc: 'Update job description library',     detail: 'Standard content update on internal HR portal.',                                                  risk: 'LOW',      decision: 'ALLOW',            minsAgo: 330 },
    ],
    'hr'
  ),
  a3: buildTimeline(
    [
      { type: 'quarantine',desc: 'Inject config into production env',  detail: 'Prompt injection pattern found in config payload. Agent quarantined pending forensic review.',   risk: 'CRITICAL', decision: 'QUARANTINE',       minsAgo: 8  },
      { type: 'block',     desc: 'Fetch Bloomberg data feed',          detail: 'Unapproved external financial data source. Connection blocked by network policy.',               risk: 'CRITICAL', decision: 'BLOCK',            minsAgo: 40 },
      { type: 'warning',   desc: 'Restart production pod',             detail: 'Pod restart in production environment outside change window. Flagged.',                          risk: 'MEDIUM',   decision: 'WARNING',          minsAgo: 80 },
      { type: 'action',    desc: 'Scale staging cluster',              detail: 'Horizontal scaling of staging environment. Within approved infra policy.',                       risk: 'LOW',      decision: 'ALLOW',            minsAgo: 120 },
      { type: 'action',    desc: 'Update load balancer rules',         detail: 'Routine LB config update on internal infrastructure.',                                           risk: 'LOW',      decision: 'ALLOW',            minsAgo: 175 },
      { type: 'warning',   desc: 'Call undocumented vendor endpoint',  detail: 'Third-party API endpoint not listed in approved integration registry.',                          risk: 'HIGH',     decision: 'WARNING',          minsAgo: 230 },
      { type: 'action',    desc: 'Run infrastructure health check',    detail: 'Scheduled health check across all services. Normal activity.',                                   risk: 'LOW',      decision: 'ALLOW',            minsAgo: 290 },
      { type: 'approval',  desc: 'Deploy hotfix to production',        detail: 'Production deployment requires change advisory board approval.',                                  risk: 'HIGH',     decision: 'REQUIRE_APPROVAL', minsAgo: 360 },
    ],
    'ops'
  ),
  a4: buildTimeline(
    [
      { type: 'warning',   desc: 'Access full customer PII record',    detail: 'Agent accessed PII fields beyond ticket scope. Flagged for compliance review.',                  risk: 'HIGH',     decision: 'WARNING',          minsAgo: 15 },
      { type: 'action',    desc: 'Send order confirmation email',      detail: 'Standard transactional email via approved SendGrid integration.',                                risk: 'LOW',      decision: 'ALLOW',            minsAgo: 30 },
      { type: 'action',    desc: 'Look up order history',              detail: 'Standard CRM lookup within ticket context. Normal operation.',                                   risk: 'LOW',      decision: 'ALLOW',            minsAgo: 55 },
      { type: 'action',    desc: 'Initiate refund workflow',           detail: 'Refund within approved limit threshold. Auto-approved.',                                         risk: 'LOW',      decision: 'ALLOW',            minsAgo: 90 },
      { type: 'action',    desc: 'Escalate ticket to Tier 2',          detail: 'Internal escalation within CRM system. No policy concerns.',                                     risk: 'LOW',      decision: 'ALLOW',            minsAgo: 125 },
      { type: 'action',    desc: 'Pull customer sentiment analysis',   detail: 'Internal analytics query for CSAT reporting.',                                                   risk: 'LOW',      decision: 'ALLOW',            minsAgo: 165 },
      { type: 'action',    desc: 'Update customer contact record',     detail: 'Standard CRM update within scope of support ticket.',                                            risk: 'LOW',      decision: 'ALLOW',            minsAgo: 210 },
      { type: 'action',    desc: 'Send satisfaction survey',           detail: 'Post-resolution survey via approved email integration.',                                         risk: 'LOW',      decision: 'ALLOW',            minsAgo: 270 },
    ],
    'sup'
  ),
};

export const agentActivityCharts: Record<string, { hour: string; events: number; blocked: number }[]> = {
  a1: [
    { hour: '08:00', events: 4, blocked: 1 }, { hour: '09:00', events: 7, blocked: 2 },
    { hour: '10:00', events: 6, blocked: 1 }, { hour: '11:00', events: 9, blocked: 3 },
    { hour: '12:00', events: 3, blocked: 0 }, { hour: '13:00', events: 5, blocked: 1 },
    { hour: '14:00', events: 8, blocked: 2 }, { hour: '15:00', events: 11, blocked: 4 },
    { hour: '16:00', events: 6, blocked: 1 }, { hour: 'Now',   events: 3, blocked: 1 },
  ],
  a2: [
    { hour: '08:00', events: 3, blocked: 0 }, { hour: '09:00', events: 5, blocked: 0 },
    { hour: '10:00', events: 4, blocked: 1 }, { hour: '11:00', events: 6, blocked: 0 },
    { hour: '12:00', events: 2, blocked: 0 }, { hour: '13:00', events: 4, blocked: 0 },
    { hour: '14:00', events: 5, blocked: 1 }, { hour: '15:00', events: 3, blocked: 0 },
    { hour: '16:00', events: 4, blocked: 0 }, { hour: 'Now',   events: 2, blocked: 0 },
  ],
  a3: [
    { hour: '08:00', events: 5, blocked: 1 }, { hour: '09:00', events: 6, blocked: 1 },
    { hour: '10:00', events: 8, blocked: 2 }, { hour: '11:00', events: 7, blocked: 1 },
    { hour: '12:00', events: 4, blocked: 0 }, { hour: '13:00', events: 9, blocked: 2 },
    { hour: '14:00', events: 12, blocked: 3 },{ hour: '15:00', events: 8, blocked: 2 },
    { hour: '16:00', events: 5, blocked: 1 }, { hour: 'Now',   events: 7, blocked: 2 },
  ],
  a4: [
    { hour: '08:00', events: 8, blocked: 0 }, { hour: '09:00', events: 14, blocked: 0 },
    { hour: '10:00', events: 11, blocked: 0 }, { hour: '11:00', events: 16, blocked: 0 },
    { hour: '12:00', events: 9, blocked: 0 }, { hour: '13:00', events: 12, blocked: 0 },
    { hour: '14:00', events: 15, blocked: 0 }, { hour: '15:00', events: 18, blocked: 0 },
    { hour: '16:00', events: 10, blocked: 0 }, { hour: 'Now',   events: 6, blocked: 0 },
  ],
};
import { RiskLevel, Decision, AgentName } from './mockData';

export type PolicyCategory =
  | 'Data Security'
  | 'Finance'
  | 'HR & Compliance'
  | 'Network'
  | 'AI Security'
  | 'Customer Data'
  | 'Infrastructure';

export type PolicyStatus = 'active' | 'disabled' | 'draft';

export interface PolicyCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface TriggerLogEntry {
  id: string;
  agent: AgentName;
  action: string;
  timestamp: Date;
  outcome: Decision;
}

export interface Policy {
  id: string;
  name: string;
  category: PolicyCategory;
  description: string;
  status: PolicyStatus;
  severity: RiskLevel;
  agentScope: AgentName[] | 'all';
  conditions: PolicyCondition[];
  action: Decision;
  stats: {
    triggered: number;
    blocked: number;
    warned: number;
    lastTriggered: Date | null;
  };
  triggerLog: TriggerLogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export const categoryMeta: Record<PolicyCategory, { icon: string; color: string; bg: string }> = {
  'Data Security':    { icon: '🔒', color: '#EF4444', bg: 'rgba(239,68,68,0.08)'   },
  'Finance':          { icon: '💰', color: '#8B3CF7', bg: 'rgba(139,60,247,0.08)'  },
  'HR & Compliance':  { icon: '👥', color: '#10B981', bg: 'rgba(16,185,129,0.08)'  },
  'Network':          { icon: '🌐', color: '#38BDF8', bg: 'rgba(56,189,248,0.08)'  },
  'AI Security':      { icon: '🤖', color: '#EC4899', bg: 'rgba(236,72,153,0.08)'  },
  'Customer Data':    { icon: '🎧', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
  'Infrastructure':   { icon: '⚙️', color: '#6366F1', bg: 'rgba(99,102,241,0.08)'  },
};

const d = (minsAgo: number) => new Date(Date.now() - minsAgo * 60 * 1000);

export const policies: Policy[] = [
  // ── Data Security ─────────────────────────────────────────────────────────
  {
    id: 'DLP-001',
    name: 'PII External Transfer Block',
    category: 'Data Security',
    description: 'Automatically blocks any agent action that attempts to transmit Personally Identifiable Information (SSN, bank details, salary, passport numbers) to external systems outside the company perimeter.',
    status: 'active',
    severity: 'CRITICAL',
    agentScope: 'all',
    conditions: [
      { id: 'c1', field: 'data_classification', operator: 'contains', value: 'PII' },
      { id: 'c2', field: 'target_system',        operator: 'not_in',  value: 'approved_internal_systems' },
    ],
    action: 'BLOCK',
    stats: { triggered: 47, blocked: 45, warned: 2, lastTriggered: d(18) },
    triggerLog: [
      { id: 'tl1', agent: 'Finance Agent',    action: 'Export payroll to S3',          timestamp: d(18),  outcome: 'BLOCK'   },
      { id: 'tl2', agent: 'HR Agent',         action: 'Send employee data externally', timestamp: d(280), outcome: 'BLOCK'   },
      { id: 'tl3', agent: 'Support Agent',    action: 'Share customer SSN via email',  timestamp: d(450), outcome: 'BLOCK'   },
    ],
    createdAt: d(43200), updatedAt: d(18),
  },
  {
    id: 'DLP-002',
    name: 'Bulk Export Volume Limit',
    category: 'Data Security',
    description: 'Triggers a WARNING and requires approval when any agent attempts to retrieve or export more than 100 records in a single operation from any database.',
    status: 'active',
    severity: 'HIGH',
    agentScope: 'all',
    conditions: [
      { id: 'c3', field: 'record_count', operator: 'exceeds', value: '100' },
      { id: 'c4', field: 'action_type',  operator: 'equals',  value: 'db_read' },
    ],
    action: 'REQUIRE_APPROVAL',
    stats: { triggered: 12, blocked: 0, warned: 12, lastTriggered: d(45) },
    triggerLog: [
      { id: 'tl4', agent: 'HR Agent',      action: 'Bulk access employee records', timestamp: d(45),  outcome: 'REQUIRE_APPROVAL' },
      { id: 'tl5', agent: 'Finance Agent', action: 'Bulk query transaction log',   timestamp: d(520), outcome: 'REQUIRE_APPROVAL' },
    ],
    createdAt: d(86400), updatedAt: d(100),
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    id: 'FIN-001',
    name: 'Payroll Data Perimeter Guard',
    category: 'Finance',
    description: 'Payroll and compensation data must never leave the company internal network. Any export or transfer to an external endpoint is blocked and escalated to CISO.',
    status: 'active',
    severity: 'CRITICAL',
    agentScope: ['Finance Agent'],
    conditions: [
      { id: 'c5', field: 'resource',     operator: 'contains', value: 'payroll' },
      { id: 'c6', field: 'action_type',  operator: 'equals',   value: 'file_write' },
      { id: 'c7', field: 'target_system',operator: 'not_in',   value: 'internal_network' },
    ],
    action: 'BLOCK',
    stats: { triggered: 8, blocked: 8, warned: 0, lastTriggered: d(18) },
    triggerLog: [
      { id: 'tl6', agent: 'Finance Agent', action: 'Export payroll to S3',       timestamp: d(18),  outcome: 'BLOCK' },
      { id: 'tl7', agent: 'Finance Agent', action: 'Send salary data via email', timestamp: d(320), outcome: 'BLOCK' },
    ],
    createdAt: d(43200), updatedAt: d(18),
  },
  {
    id: 'FIN-002',
    name: 'Off-Hours Finance Activity',
    category: 'Finance',
    description: 'Flags any Finance Agent database access occurring outside business hours (08:00–18:00 UTC) as suspicious and requires senior approval before execution.',
    status: 'active',
    severity: 'HIGH',
    agentScope: ['Finance Agent'],
    conditions: [
      { id: 'c8', field: 'timestamp_hour', operator: 'not_in',  value: '8-18' },
      { id: 'c9', field: 'action_type',    operator: 'contains', value: 'db_' },
    ],
    action: 'WARNING',
    stats: { triggered: 6, blocked: 0, warned: 6, lastTriggered: d(28) },
    triggerLog: [
      { id: 'tl8', agent: 'Finance Agent', action: 'Query payroll at 02:14 AM', timestamp: d(28), outcome: 'WARNING' },
    ],
    createdAt: d(86400), updatedAt: d(28),
  },

  // ── HR & Compliance ────────────────────────────────────────────────────────
  {
    id: 'HR-001',
    name: 'Data Minimization Principle',
    category: 'HR & Compliance',
    description: 'HR agents may only access the minimum data necessary for the current task context. Bulk queries over 50 records require HR manager authorization.',
    status: 'active',
    severity: 'HIGH',
    agentScope: ['HR Agent'],
    conditions: [
      { id: 'c10', field: 'record_count',    operator: 'exceeds', value: '50'          },
      { id: 'c11', field: 'resource',        operator: 'contains', value: 'hr_database' },
    ],
    action: 'REQUIRE_APPROVAL',
    stats: { triggered: 9, blocked: 0, warned: 9, lastTriggered: d(45) },
    triggerLog: [
      { id: 'tl9', agent: 'HR Agent', action: 'Bulk employee record access', timestamp: d(45), outcome: 'REQUIRE_APPROVAL' },
    ],
    createdAt: d(43200), updatedAt: d(45),
  },
  {
    id: 'HR-002',
    name: 'Terminated Employee Data Retention',
    category: 'HR & Compliance',
    description: 'Access to records of terminated employees beyond a 2-year retention window is blocked per GDPR Article 17 right to erasure compliance.',
    status: 'active',
    severity: 'MEDIUM',
    agentScope: ['HR Agent'],
    conditions: [
      { id: 'c12', field: 'employee_status', operator: 'equals',  value: 'terminated' },
      { id: 'c13', field: 'record_age_days', operator: 'exceeds', value: '730'         },
    ],
    action: 'BLOCK',
    stats: { triggered: 3, blocked: 3, warned: 0, lastTriggered: d(260) },
    triggerLog: [
      { id: 'tl10', agent: 'HR Agent', action: 'Access terminated employee records', timestamp: d(260), outcome: 'BLOCK' },
    ],
    createdAt: d(86400), updatedAt: d(260),
  },

  // ── Network ───────────────────────────────────────────────────────────────
  {
    id: 'NET-001',
    name: 'Approved Integration Registry',
    category: 'Network',
    description: 'All outbound HTTP/HTTPS calls from AI agents must target endpoints registered in the approved integration catalog. Unregistered endpoints are blocked automatically.',
    status: 'active',
    severity: 'HIGH',
    agentScope: 'all',
    conditions: [
      { id: 'c14', field: 'target_url',    operator: 'not_in',  value: 'approved_integration_registry' },
      { id: 'c15', field: 'action_type',   operator: 'equals',  value: 'http_call'                     },
    ],
    action: 'BLOCK',
    stats: { triggered: 15, blocked: 13, warned: 2, lastTriggered: d(40) },
    triggerLog: [
      { id: 'tl11', agent: 'Operations Agent', action: 'Fetch Bloomberg data feed',       timestamp: d(40),  outcome: 'BLOCK'   },
      { id: 'tl12', agent: 'Operations Agent', action: 'Call undocumented vendor endpoint',timestamp: d(230), outcome: 'WARNING' },
    ],
    createdAt: d(43200), updatedAt: d(40),
  },
  {
    id: 'NET-002',
    name: 'DNS Reputation Check',
    category: 'Network',
    description: 'Checks the reputation score of all external domains against threat intelligence feeds. Domains with low reputation scores trigger a WARNING or BLOCK.',
    status: 'active',
    severity: 'MEDIUM',
    agentScope: 'all',
    conditions: [
      { id: 'c16', field: 'domain_reputation', operator: 'equals',  value: 'unknown'  },
      { id: 'c17', field: 'action_type',        operator: 'equals',  value: 'http_call' },
    ],
    action: 'WARNING',
    stats: { triggered: 7, blocked: 0, warned: 7, lastTriggered: d(180) },
    triggerLog: [
      { id: 'tl13', agent: 'Operations Agent', action: 'Call api.vendor-x.io/v3/data', timestamp: d(180), outcome: 'WARNING' },
    ],
    createdAt: d(86400), updatedAt: d(180),
  },

  // ── AI Security ───────────────────────────────────────────────────────────
  {
    id: 'SEC-001',
    name: 'Prompt Injection Detection',
    category: 'AI Security',
    description: 'Scans all tool responses and external data inputs for adversarial instruction patterns (role-switch tokens, system override directives, log suppression commands). Matching content triggers immediate quarantine.',
    status: 'active',
    severity: 'CRITICAL',
    agentScope: 'all',
    conditions: [
      { id: 'c18', field: 'input_content',   operator: 'matches',  value: 'SYSTEM OVERRIDE|IGNORE PREVIOUS|disable.*security|role.*switch' },
    ],
    action: 'QUARANTINE',
    stats: { triggered: 4, blocked: 4, warned: 0, lastTriggered: d(8) },
    triggerLog: [
      { id: 'tl14', agent: 'Operations Agent', action: 'Inject config into production', timestamp: d(8), outcome: 'QUARANTINE' },
    ],
    createdAt: d(43200), updatedAt: d(8),
  },
  {
    id: 'SEC-002',
    name: 'Agent Self-Modification Block',
    category: 'AI Security',
    description: 'Prevents any agent from modifying its own system prompt, tool list, or governance constraints during a session. This prevents jailbreak-style self-modification attacks.',
    status: 'active',
    severity: 'CRITICAL',
    agentScope: 'all',
    conditions: [
      { id: 'c19', field: 'action_target', operator: 'equals', value: 'system_prompt' },
      { id: 'c20', field: 'action_type',   operator: 'equals', value: 'write'         },
    ],
    action: 'BLOCK',
    stats: { triggered: 2, blocked: 2, warned: 0, lastTriggered: d(720) },
    triggerLog: [
      { id: 'tl15', agent: 'Finance Agent', action: 'Attempt to modify system prompt', timestamp: d(720), outcome: 'BLOCK' },
    ],
    createdAt: d(43200), updatedAt: d(720),
  },

  // ── Customer Data ─────────────────────────────────────────────────────────
  {
    id: 'CUST-001',
    name: 'Customer PII Minimum Access',
    category: 'Customer Data',
    description: 'Support agents may only access PII fields directly relevant to the current active ticket. Accessing additional PII fields (payment method, address history) triggers a WARNING and compliance review.',
    status: 'active',
    severity: 'MEDIUM',
    agentScope: ['Support Agent'],
    conditions: [
      { id: 'c21', field: 'pii_fields_accessed', operator: 'exceeds', value: 'ticket_required_fields' },
      { id: 'c22', field: 'resource',            operator: 'contains', value: 'customer_database'     },
    ],
    action: 'WARNING',
    stats: { triggered: 11, blocked: 0, warned: 11, lastTriggered: d(120) },
    triggerLog: [
      { id: 'tl16', agent: 'Support Agent', action: 'Access customer PII beyond ticket scope', timestamp: d(120), outcome: 'WARNING' },
    ],
    createdAt: d(43200), updatedAt: d(120),
  },

  // ── Infrastructure ────────────────────────────────────────────────────────
  {
    id: 'OPS-001',
    name: 'Production Environment Guard',
    category: 'Infrastructure',
    description: 'Blocks any unapproved writes, deployments, or configuration changes to production systems outside approved change windows. Production changes require Change Advisory Board (CAB) approval.',
    status: 'active',
    severity: 'CRITICAL',
    agentScope: ['Operations Agent'],
    conditions: [
      { id: 'c23', field: 'environment',  operator: 'equals', value: 'production' },
      { id: 'c24', field: 'action_type',  operator: 'not_in', value: 'read,list,monitor' },
      { id: 'c25', field: 'change_ticket',operator: 'equals', value: 'missing' },
    ],
    action: 'BLOCK',
    stats: { triggered: 6, blocked: 6, warned: 0, lastTriggered: d(8) },
    triggerLog: [
      { id: 'tl17', agent: 'Operations Agent', action: 'Inject config into production', timestamp: d(8),  outcome: 'BLOCK' },
      { id: 'tl18', agent: 'Operations Agent', action: 'Deploy without change ticket',  timestamp: d(360), outcome: 'BLOCK' },
    ],
    createdAt: d(43200), updatedAt: d(8),
  },
  {
    id: 'OPS-002',
    name: 'Change Window Enforcement',
    category: 'Infrastructure',
    description: 'Infrastructure modifications (pod restarts, scaling, LB changes) outside approved maintenance windows (Sunday 02:00–04:00 UTC) require on-call approval.',
    status: 'draft',
    severity: 'MEDIUM',
    agentScope: ['Operations Agent'],
    conditions: [
      { id: 'c26', field: 'action_type',  operator: 'contains', value: 'restart,scale,update' },
      { id: 'c27', field: 'environment',  operator: 'equals',   value: 'production' },
      { id: 'c28', field: 'in_maintenance_window', operator: 'equals', value: 'false' },
    ],
    action: 'REQUIRE_APPROVAL',
    stats: { triggered: 0, blocked: 0, warned: 0, lastTriggered: null },
    triggerLog: [],
    createdAt: d(240), updatedAt: d(240),
  },
];

export const allCategories: PolicyCategory[] = [
  'Data Security', 'Finance', 'HR & Compliance',
  'Network', 'AI Security', 'Customer Data', 'Infrastructure',
];

export const fieldOptions = [
  { value: 'action_type',          label: 'Action Type'             },
  { value: 'resource',             label: 'Resource Name'           },
  { value: 'target_system',        label: 'Target System'           },
  { value: 'target_url',           label: 'Target URL'              },
  { value: 'data_classification',  label: 'Data Classification'     },
  { value: 'record_count',         label: 'Record Count'            },
  { value: 'environment',          label: 'Environment'             },
  { value: 'input_content',        label: 'Input Content'           },
  { value: 'domain_reputation',    label: 'Domain Reputation'       },
  { value: 'employee_status',      label: 'Employee Status'         },
  { value: 'timestamp_hour',       label: 'Timestamp Hour'          },
  { value: 'pii_fields_accessed',  label: 'PII Fields Accessed'     },
];

export const operatorOptions = [
  { value: 'contains',  label: 'contains'  },
  { value: 'equals',    label: 'equals'    },
  { value: 'not_in',    label: 'not in'    },
  { value: 'exceeds',   label: 'exceeds'   },
  { value: 'matches',   label: 'matches (regex)' },
];

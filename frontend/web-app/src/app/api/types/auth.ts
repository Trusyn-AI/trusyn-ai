import type { Decision, Severity } from './common';

export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ANALYST' | 'DEVELOPER';

export type UserDto = {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string | null;
  preferences?: Record<string, unknown>;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationDto = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  plan: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'DISABLED';
  website?: string | null;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_token_expires_in: number;
  refresh_token_expires_in: number;
  user: UserDto;
  organization: OrganizationDto;
};

export type CurrentUserResponse = {
  user: UserDto;
  organization: OrganizationDto;
  role: string;
  permissions: string[];
};

export type AuditLogDto = {
  id: string;
  organization_id: string;
  user_id?: string | null;
  event_type: string;
  severity: Severity;
  message: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  created_at: string;
  updated_at: string;
};

export type AgentDto = {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  status: 'OPERATIONAL' | 'WARNING' | 'QUARANTINED' | 'BLOCKED';
  trust_score: number;
  permissions: Record<string, unknown>;
  metadata: Record<string, unknown>;
  last_active_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type PolicyDto = {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  rule_definition: Record<string, unknown>;
  enforcement_action: Decision;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type ThreatDto = {
  id: string;
  organization_id: string;
  agent_id?: string | null;
  threat_type: string;
  severity: Severity;
  title: string;
  description?: string | null;
  raw_payload: Record<string, unknown>;
  source_ip?: string | null;
  detected_at: string;
  created_at: string;
  updated_at: string;
};

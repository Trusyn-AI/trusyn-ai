export type UserRole = "SUPER_ADMIN" | "ORG_ADMIN" | "ANALYST" | "DEVELOPER";

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
  status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "DISABLED";
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


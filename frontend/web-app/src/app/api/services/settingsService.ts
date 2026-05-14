import { apiRequest } from "../client";
import { endpoints } from "../endpoints";
import type { OrganizationDto, UserDto } from "../types/auth";
import type { ApiKeyCreateResponseDto, ApiKeyItemDto, IntegrationDto } from "../types/domain";

export type UpdateCurrentUserPayload = {
  full_name?: string;
  avatar_url?: string | null;
  preferences?: Record<string, unknown>;
  current_password?: string;
  new_password?: string;
};

export type UpdateOrganizationPayload = {
  name?: string;
  description?: string | null;
  website?: string | null;
  settings?: Record<string, unknown>;
};

export type UpdateIntegrationPayload = {
  enabled: boolean;
  config: Record<string, unknown>;
};

export type CreateApiKeyPayload = {
  name: string;
  permissions?: Record<string, unknown>;
  expires_at?: string | null;
};

export const settingsService = {
  getCurrentUser(): Promise<UserDto> {
    return apiRequest<UserDto>(endpoints.users.me, { method: "GET" });
  },

  updateCurrentUser(payload: UpdateCurrentUserPayload): Promise<UserDto> {
    return apiRequest<UserDto>(endpoints.users.me, {
      method: "PATCH",
      body: payload,
    });
  },

  getCurrentOrganization(): Promise<OrganizationDto> {
    return apiRequest<OrganizationDto>(endpoints.organizations.current, { method: "GET" });
  },

  updateCurrentOrganization(payload: UpdateOrganizationPayload): Promise<OrganizationDto> {
    return apiRequest<OrganizationDto>(endpoints.organizations.current, {
      method: "PATCH",
      body: payload,
    });
  },

  listIntegrations(): Promise<IntegrationDto[]> {
    return apiRequest<IntegrationDto[]>(endpoints.integrations.base, { method: "GET" });
  },

  updateIntegration(integrationKey: string, payload: UpdateIntegrationPayload): Promise<IntegrationDto> {
    return apiRequest<IntegrationDto>(endpoints.integrations.byKey(integrationKey), {
      method: "PATCH",
      body: payload,
    });
  },

  listApiKeys(): Promise<ApiKeyItemDto[]> {
    return apiRequest<ApiKeyItemDto[]>(endpoints.apiKeys.base, { method: "GET" });
  },

  createApiKey(payload: CreateApiKeyPayload): Promise<ApiKeyCreateResponseDto> {
    return apiRequest<ApiKeyCreateResponseDto>(endpoints.apiKeys.base, {
      method: "POST",
      body: payload,
    });
  },

  deleteApiKey(apiKeyId: string): Promise<{ status: string }> {
    return apiRequest<{ status: string }>(endpoints.apiKeys.byId(apiKeyId), {
      method: "DELETE",
    });
  },
};

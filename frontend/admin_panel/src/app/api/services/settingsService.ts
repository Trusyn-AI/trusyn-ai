import { apiRequest } from '../client';
import { endpoints } from '../endpoints';
import type {
  ApiKeyCreateResponse,
  ApiKeyListItem,
  IntegrationDto,
  OrganizationDto,
  UserDto,
} from '../types/admin';

export type UpdateCurrentUserPayload = {
  full_name?: string;
  avatar_url?: string | null;
  preferences?: Record<string, unknown>;
  current_password?: string;
  new_password?: string;
};

export type UpdateOrganizationPayload = {
  name?: string;
  slug?: string;
  description?: string | null;
  plan?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'DISABLED';
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
    return apiRequest<UserDto>(endpoints.users.me, { method: 'GET' });
  },

  updateCurrentUser(payload: UpdateCurrentUserPayload): Promise<UserDto> {
    return apiRequest<UserDto>(endpoints.users.me, {
      method: 'PATCH',
      body: payload,
    });
  },

  getCurrentOrganization(): Promise<OrganizationDto> {
    return apiRequest<OrganizationDto>(endpoints.organizations.current, { method: 'GET' });
  },

  updateCurrentOrganization(payload: UpdateOrganizationPayload): Promise<OrganizationDto> {
    return apiRequest<OrganizationDto>(endpoints.organizations.current, {
      method: 'PATCH',
      body: payload,
    });
  },

  listIntegrations(): Promise<IntegrationDto[]> {
    return apiRequest<IntegrationDto[]>(endpoints.integrations.base, { method: 'GET' });
  },

  updateIntegration(integrationKey: string, payload: UpdateIntegrationPayload): Promise<IntegrationDto> {
    return apiRequest<IntegrationDto>(endpoints.integrations.byKey(integrationKey), {
      method: 'PATCH',
      body: payload,
    });
  },

  listApiKeys(): Promise<ApiKeyListItem[]> {
    return apiRequest<ApiKeyListItem[]>(endpoints.apiKeys.base, { method: 'GET' });
  },

  createApiKey(payload: CreateApiKeyPayload): Promise<ApiKeyCreateResponse> {
    return apiRequest<ApiKeyCreateResponse>(endpoints.apiKeys.base, {
      method: 'POST',
      body: payload,
    });
  },

  deleteApiKey(apiKeyId: string): Promise<{ status: string }> {
    return apiRequest<{ status: string }>(endpoints.apiKeys.byId(apiKeyId), {
      method: 'DELETE',
    });
  },
};

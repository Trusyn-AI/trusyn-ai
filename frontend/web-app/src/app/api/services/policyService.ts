import { apiRequest } from '../client';
import { endpoints } from '../endpoints';
import type { PolicyDto } from '../types/auth';
import type { PaginatedResult } from '../types/common';

export type PolicyCreatePayload = {
  name: string;
  description?: string;
  rule_definition: Record<string, unknown>;
  enforcement_action: PolicyDto['enforcement_action'];
  enabled: boolean;
};

export const policyService = {
  list(params?: {
    limit?: number;
    offset?: number;
    enabled?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedResult<PolicyDto>> {
    return apiRequest<PaginatedResult<PolicyDto>>(endpoints.policies.base, {
      method: 'GET',
      query: params,
    });
  },

  getById(policyId: string): Promise<PolicyDto> {
    return apiRequest<PolicyDto>(endpoints.policies.byId(policyId), { method: 'GET' });
  },

  create(payload: PolicyCreatePayload): Promise<PolicyDto> {
    return apiRequest<PolicyDto>(endpoints.policies.base, {
      method: 'POST',
      body: payload,
    });
  },

  update(policyId: string, payload: Partial<PolicyCreatePayload>): Promise<PolicyDto> {
    return apiRequest<PolicyDto>(endpoints.policies.byId(policyId), {
      method: 'PATCH',
      body: payload,
    });
  },

  remove(policyId: string): Promise<{ status: string }> {
    return apiRequest<{ status: string }>(endpoints.policies.byId(policyId), { method: 'DELETE' });
  },
};

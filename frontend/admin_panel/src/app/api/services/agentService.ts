import { apiRequest } from '../client';
import { endpoints } from '../endpoints';
import type { AgentDto } from '../types/admin';
import type { PaginatedResult } from '../types/common';

export const agentService = {
  list(params?: {
    limit?: number;
    offset?: number;
    status?: AgentDto['status'];
  }): Promise<PaginatedResult<AgentDto>> {
    return apiRequest<PaginatedResult<AgentDto>>(endpoints.agents.base, {
      method: 'GET',
      query: params,
    });
  },

  getById(agentId: string): Promise<AgentDto> {
    return apiRequest<AgentDto>(endpoints.agents.byId(agentId), { method: 'GET' });
  },

  update(
    agentId: string,
    payload: Partial<Pick<AgentDto, 'name' | 'description' | 'status' | 'trust_score' | 'permissions' | 'metadata'>>,
  ): Promise<AgentDto> {
    return apiRequest<AgentDto>(endpoints.agents.byId(agentId), {
      method: 'PATCH',
      body: payload,
    });
  },

  remove(agentId: string): Promise<{ status: string }> {
    return apiRequest<{ status: string }>(endpoints.agents.byId(agentId), { method: 'DELETE' });
  },
};

import { apiRequest } from '../client';
import { endpoints } from '../endpoints';
import type { ThreatDto } from '../types/auth';
import type { ThreatInvestigationDto } from '../types/domain';
import type { PaginatedResult, Severity } from '../types/common';

export const threatService = {
  list(params?: {
    limit?: number;
    offset?: number;
    severity?: Severity;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedResult<ThreatDto>> {
    return apiRequest<PaginatedResult<ThreatDto>>(endpoints.threats.base, {
      method: 'GET',
      query: params,
    });
  },

  getById(threatId: string): Promise<ThreatDto> {
    return apiRequest<ThreatDto>(endpoints.threats.byId(threatId), { method: 'GET' });
  },

  investigation(threatId: string): Promise<ThreatInvestigationDto> {
    return apiRequest<ThreatInvestigationDto>(endpoints.threats.investigation(threatId), { method: 'GET' });
  },
};

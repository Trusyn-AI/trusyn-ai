import { apiRequest } from '../client';
import { endpoints } from '../endpoints';
import type { AuditLogDto } from '../types/auth';
import type { PaginatedResult, Severity } from '../types/common';

export const auditService = {
  list(params?: {
    limit?: number;
    offset?: number;
    severity?: Severity;
    event_type?: string;
    user_id?: string;
    start_at?: string;
    end_at?: string;
    search?: string;
    sort_by?: 'timestamp' | 'severity' | 'event_type';
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedResult<AuditLogDto>> {
    return apiRequest<PaginatedResult<AuditLogDto>>(endpoints.auditLogs.base, {
      method: 'GET',
      query: params,
    });
  },

  getById(logId: string): Promise<AuditLogDto> {
    return apiRequest<AuditLogDto>(endpoints.auditLogs.byId(logId), { method: 'GET' });
  },
};

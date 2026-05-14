import { apiRequest } from '../client';
import { endpoints } from '../endpoints';
import type { AuditLogDto } from '../types/admin';
import type { PaginatedResult, Severity } from '../types/common';

export const auditService = {
  list(params?: {
    limit?: number;
    offset?: number;
    severity?: Severity;
    event_type?: string;
    user_id?: string;
    organization_id?: string;
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

  getById(logId: string, organizationId?: string): Promise<AuditLogDto> {
    return apiRequest<AuditLogDto>(endpoints.auditLogs.byId(logId), {
      method: 'GET',
      query: organizationId ? { organization_id: organizationId } : undefined,
    });
  },

  exportAuditCsv(organizationId?: string): Promise<Blob> {
    const query = new URLSearchParams({ format: 'csv' });
    if (organizationId) {
      query.set('organization_id', organizationId);
    }

    return fetch(
      `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')}${endpoints.exports.audit}?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('trusyn_admin_access_token') ?? ''}`,
        },
      },
    ).then(async response => {
      if (!response.ok) {
        throw new Error('Unable to export audit logs');
      }
      return response.blob();
    });
  },
};

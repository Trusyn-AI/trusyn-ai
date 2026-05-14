import { apiRequest } from '../client';
import { endpoints } from '../endpoints';
import type {
  AdminApiMonitoringSummary,
  AdminAPIRequestItem,
  AdminOrganizationItem,
  AdminPlatformOverview,
} from '../types/admin';
import type { PaginatedResult } from '../types/common';

export const adminService = {
  listOrganizations(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'DISABLED';
    plan?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedResult<AdminOrganizationItem>> {
    return apiRequest<PaginatedResult<AdminOrganizationItem>>(endpoints.admin.organizations, {
      method: 'GET',
      query: params,
    });
  },

  platformOverview(): Promise<AdminPlatformOverview> {
    return apiRequest<AdminPlatformOverview>(endpoints.admin.platformOverview, { method: 'GET' });
  },

  apiMonitoringSummary(): Promise<AdminApiMonitoringSummary> {
    return apiRequest<AdminApiMonitoringSummary>(endpoints.admin.apiMonitoringSummary, {
      method: 'GET',
    });
  },

  apiMonitoringRequests(params?: {
    limit?: number;
    offset?: number;
    organization_id?: string;
    model?: string;
    status?: 'success' | 'blocked' | 'failed';
    start_at?: string;
    end_at?: string;
  }): Promise<PaginatedResult<AdminAPIRequestItem>> {
    return apiRequest<PaginatedResult<AdminAPIRequestItem>>(endpoints.admin.apiMonitoringRequests, {
      method: 'GET',
      query: params,
    });
  },
};

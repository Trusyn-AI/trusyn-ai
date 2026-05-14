import { apiRequest } from '../client';
import { endpoints } from '../endpoints';
import type { DashboardSummaryDto } from '../types/dashboard';

export const dashboardService = {
  summary(): Promise<DashboardSummaryDto> {
    return apiRequest<DashboardSummaryDto>(endpoints.dashboard.summary, { method: 'GET' });
  },
};

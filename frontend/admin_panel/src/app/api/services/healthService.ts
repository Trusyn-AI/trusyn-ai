import { apiRequest } from '../client';
import { endpoints } from '../endpoints';
import type { APIHealthResponse, ComponentHealthResponse, DbHealthResponse, MetricsResponse } from '../types/admin';

export const healthService = {
  api(): Promise<APIHealthResponse> {
    return apiRequest<APIHealthResponse>(endpoints.health.api, { method: 'GET' });
  },

  db(): Promise<DbHealthResponse> {
    return apiRequest<DbHealthResponse>(endpoints.health.db, { method: 'GET' });
  },

  cache(): Promise<ComponentHealthResponse> {
    return apiRequest<ComponentHealthResponse>(endpoints.health.cache, { method: 'GET' });
  },

  ws(): Promise<ComponentHealthResponse> {
    return apiRequest<ComponentHealthResponse>(endpoints.health.ws, { method: 'GET' });
  },

  governance(): Promise<ComponentHealthResponse> {
    return apiRequest<ComponentHealthResponse>(endpoints.health.governance, { method: 'GET' });
  },

  metrics(): Promise<MetricsResponse> {
    return apiRequest<MetricsResponse>(endpoints.system.metrics, { method: 'GET' });
  },
};

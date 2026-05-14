import { apiRequest, authSessionHelpers } from '../client';
import { endpoints } from '../endpoints';
import type { CurrentUserResponse, LoginRequest, TokenResponse } from '../types/auth';

export const authService = {
  async login(payload: LoginRequest): Promise<TokenResponse> {
    const data = await apiRequest<TokenResponse>(endpoints.auth.login, {
      method: 'POST',
      auth: false,
      body: payload,
    });
    authSessionHelpers.applyAuthSession(data);
    return data;
  },

  async me(): Promise<CurrentUserResponse> {
    return apiRequest<CurrentUserResponse>(endpoints.auth.me, { method: 'GET' });
  },

  logout(): void {
    authSessionHelpers.clearAuthState();
  },
};

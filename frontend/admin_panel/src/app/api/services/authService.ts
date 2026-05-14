import { apiRequest, authSessionHelpers } from '../client';
import { endpoints } from '../endpoints';
import type { CurrentUserResponse, LoginRequest, TokenResponse } from '../types/auth';
import { setSessionUser } from '../../utils/sessionUser';

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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
    const data = await apiRequest<CurrentUserResponse>(endpoints.auth.me, { method: 'GET' });
    setSessionUser({
      id: data.user.id,
      organizationId: data.user.organization_id,
      name: data.user.full_name,
      role: data.user.role,
      email: data.user.email,
      initials: initialsFromName(data.user.full_name),
    });
    return data;
  },

  logout(): void {
    authSessionHelpers.clearAuthState();
  },
};

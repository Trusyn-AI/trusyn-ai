import { clearSessionUser, setSessionUser } from "../utils/sessionUser";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth";
import { endpoints } from "./endpoints";
import { ApiError, type ApiErrorPayload } from "./errors";
import type { TokenResponse } from "./types/auth";
import type { ApiSuccess } from "./types/common";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 15000;

let refreshPromise: Promise<string | null> | null = null;

function buildUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  return safeJsonParse(text);
}

function toApiError(response: Response, payload: unknown): ApiError {
  const parsed = (payload as ApiErrorPayload) ?? {};
  const message = parsed?.error?.message ?? `Request failed with status ${response.status}`;
  return new ApiError({
    status: response.status,
    message,
    code: parsed?.error?.code ?? "http_error",
    details: parsed?.error?.details,
    requestId: parsed?.request_id,
  });
}

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .map(part => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function applyAuthSession(responseData: TokenResponse): void {
  setTokens({
    accessToken: responseData.access_token,
    refreshToken: responseData.refresh_token,
  });
  const user = responseData.user;
  setSessionUser({
    id: user.id,
    organizationId: user.organization_id,
    name: user.full_name,
    role: user.role,
    email: user.email,
    initials: initialsFromName(user.full_name),
  });
}

function clearAuthState(): void {
  clearTokens();
  clearSessionUser();
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthState();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(buildUrl(endpoints.auth.refresh), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const payload = await parseResponseBody(response);
      if (!response.ok) {
        clearAuthState();
        throw toApiError(response, payload);
      }

      const successPayload = payload as ApiSuccess<TokenResponse>;
      applyAuthSession(successPayload.data);
      return successPayload.data.access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  try {
    return await refreshPromise;
  } catch {
    return null;
  }
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
  signal?: AbortSignal;
  requestId?: string;
};

function buildQuery(params: RequestOptions["query"]): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.append(key, String(value));
  });
  const serialized = qs.toString();
  return serialized ? `?${serialized}` : "";
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, auth = true, retryOnUnauthorized = true, signal, requestId } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (requestId) headers.set("x-request-id", requestId);

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const mergedSignal = signal ?? controller.signal;

  try {
    const response = await fetch(`${buildUrl(path)}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: mergedSignal,
    });

    const payload = await parseResponseBody(response);

    if (response.status === 401 && auth && retryOnUnauthorized && path !== endpoints.auth.refresh) {
      const renewedToken = await refreshAccessToken();
      if (renewedToken) return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }

    if (!response.ok) throw toApiError(response, payload);

    const successPayload = payload as ApiSuccess<T>;
    return successPayload.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError({
        status: 408,
        message: "Request timed out. Please try again.",
        code: "request_timeout",
      });
    }

    throw new ApiError({
      status: 0,
      message: "Unable to connect to backend. Check API URL and server status.",
      code: "network_error",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export const authSessionHelpers = {
  applyAuthSession,
  clearAuthState,
};


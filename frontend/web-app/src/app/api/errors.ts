export type ApiErrorPayload = {
  success?: boolean;
  request_id?: string | null;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown> | null;
  };
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown> | null;
  requestId?: string | null;

  constructor(input: {
    status: number;
    message: string;
    code?: string;
    details?: Record<string, unknown> | null;
    requestId?: string | null;
  }) {
    super(input.message);
    this.name = 'ApiError';
    this.status = input.status;
    this.code = input.code ?? 'api_error';
    this.details = input.details;
    this.requestId = input.requestId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

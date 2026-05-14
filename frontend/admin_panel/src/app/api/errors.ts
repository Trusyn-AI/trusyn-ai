export type ApiErrorPayload = {
  success?: boolean;
  request_id?: string;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;
  requestId?: string;

  constructor(args: {
    status: number;
    message: string;
    code?: string;
    details?: Record<string, unknown>;
    requestId?: string;
  }) {
    super(args.message);
    this.name = "ApiError";
    this.status = args.status;
    this.code = args.code ?? "unknown_error";
    this.details = args.details;
    this.requestId = args.requestId;
  }
}


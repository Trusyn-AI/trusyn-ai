export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string | null;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Decision = 'ALLOW' | 'BLOCK' | 'REVIEW' | 'QUARANTINE' | 'RATE_LIMIT';

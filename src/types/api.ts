export type ApiErrorCode =
  'INVALID_REQUEST' | 'UNAUTHORIZED' | 'RATE_LIMITED' | 'SERVICE_UNAVAILABLE';

export interface ApiSuccess<T> {
  readonly data: T;
  readonly error: null;
}

export interface ApiFailure {
  readonly data: null;
  readonly error: {
    readonly code: ApiErrorCode;
    readonly message: string;
  };
}

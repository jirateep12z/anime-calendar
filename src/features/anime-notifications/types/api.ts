import { NextResponse } from 'next/server';

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

export interface AuthenticatedDevice {
  readonly device_id: string;
  readonly session_token_hash: string;
}

export function CreateApiSuccess<T>(
  data: T,
  status = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data, error: null }, { status });
}

export function CreateApiError(
  error_code: ApiErrorCode,
  message: string,
  status: number
): NextResponse<ApiFailure> {
  return NextResponse.json(
    { data: null, error: { code: error_code, message } },
    { status }
  );
}

import 'server-only';

import { NextResponse } from 'next/server';

import type { ApiErrorCode, ApiFailure, ApiSuccess } from '@/types/api';

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

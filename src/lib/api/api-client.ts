'use client';

import { z } from 'zod';

import type { ApiErrorCode, ApiSuccess } from '@/types/api';

const ApiFailureSchema = z.strictObject({
  data: z.null(),
  error: z.strictObject({
    code: z.enum([
      'INVALID_REQUEST',
      'UNAUTHORIZED',
      'RATE_LIMITED',
      'SERVICE_UNAVAILABLE'
    ]),
    message: z.string()
  })
});

export type ApiClientErrorCode = ApiErrorCode | 'NETWORK' | 'INVALID_RESPONSE';

export class ApiClientError<
  ErrorCode extends string = ApiClientErrorCode
> extends Error {
  public readonly error_code: ErrorCode;
  public readonly http_status: number | null;
  public readonly cause: unknown;

  public constructor(
    error_code: ErrorCode,
    message: string,
    http_status: number | null = null,
    cause: unknown = null
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.error_code = error_code;
    this.http_status = http_status;
    this.cause = cause;
  }
}

type ApiSuccessBody<T> = ApiSuccess<T>;

export async function RequestApi<T>(
  request_url: string,
  response_schema: z.ZodType<T>,
  request_init?: RequestInit
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(request_url, {
      credentials: 'same-origin',
      ...request_init
    });
  } catch (error) {
    throw new ApiClientError(
      'NETWORK',
      'ไม่สามารถเชื่อมต่อ API ได้',
      null,
      error
    );
  }

  let response_body: unknown;

  try {
    response_body = (await response.json()) as unknown;
  } catch (error) {
    throw new ApiClientError(
      'INVALID_RESPONSE',
      'API ส่งข้อมูลที่อ่านไม่ได้',
      response.status,
      error
    );
  }

  if (!response.ok) {
    const failure_result = ApiFailureSchema.safeParse(response_body);

    if (failure_result.success) {
      throw new ApiClientError(
        failure_result.data.error.code,
        failure_result.data.error.message,
        response.status
      );
    }

    throw new ApiClientError(
      'INVALID_RESPONSE',
      'API ส่งข้อผิดพลาดที่อ่านไม่ได้',
      response.status
    );
  }

  const success_result = z
    .strictObject({ data: response_schema, error: z.null() })
    .safeParse(response_body);

  if (!success_result.success) {
    throw new ApiClientError(
      'INVALID_RESPONSE',
      'API ส่งข้อมูลไม่ตรงรูปแบบ',
      response.status
    );
  }

  return (success_result.data as ApiSuccessBody<T>).data;
}

export function CreateJsonMutation(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body: unknown
): RequestInit {
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  };
}

export function IsRetryableApiClientError(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.error_code === 'NETWORK' ||
      error.error_code === 'RATE_LIMITED' ||
      error.error_code === 'SERVICE_UNAVAILABLE')
  );
}

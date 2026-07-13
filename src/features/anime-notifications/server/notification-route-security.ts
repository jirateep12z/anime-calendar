import 'server-only';

import type { NextRequest, NextResponse } from 'next/server';

import { EnforceRequestRateLimit, type RateLimitClass } from './api-rate-limit';
import { AuthenticateDevice } from './device-session';
import { RequestSecurityError } from './request-security';

import {
  CreateApiError,
  type ApiErrorCode,
  type ApiFailure,
  type AuthenticatedDevice
} from '../types/api';

export class NotificationRouteError extends Error {
  public readonly error_code: ApiErrorCode;
  public readonly http_status: number;

  public constructor(
    error_code: ApiErrorCode,
    message: string,
    http_status: number
  ) {
    super(message);
    this.name = 'NotificationRouteError';
    this.error_code = error_code;
    this.http_status = http_status;
  }
}

export async function AuthorizeNotificationRequest(
  request: NextRequest,
  rate_limit_class: RateLimitClass
): Promise<AuthenticatedDevice> {
  const authenticated_device = await AuthenticateDevice(request);

  if (authenticated_device === null) {
    throw new NotificationRouteError(
      'UNAUTHORIZED',
      'เซสชันอุปกรณ์หมดอายุ กรุณาเริ่มเซสชันใหม่',
      401
    );
  }

  const is_request_allowed = await EnforceRequestRateLimit(
    request,
    rate_limit_class,
    authenticated_device.device_id
  );

  if (!is_request_allowed) {
    throw new NotificationRouteError(
      'RATE_LIMITED',
      'มีคำขอจากอุปกรณ์นี้มากเกินไป กรุณารอสักครู่แล้วลองใหม่',
      429
    );
  }

  return authenticated_device;
}

export function CreateNotificationRouteErrorResponse(
  error: unknown
): NextResponse<ApiFailure> {
  if (error instanceof NotificationRouteError) {
    return CreateApiError(error.error_code, error.message, error.http_status);
  }

  if (error instanceof RequestSecurityError) {
    return CreateApiError('INVALID_REQUEST', 'ข้อมูลคำขอไม่ถูกต้อง', 400);
  }

  return CreateApiError(
    'SERVICE_UNAVAILABLE',
    'บริการแจ้งเตือนยังไม่พร้อม กรุณาลองใหม่',
    503
  );
}

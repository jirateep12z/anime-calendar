import type { NextRequest, NextResponse } from 'next/server';

import { EnforceRequestRateLimit } from '@/features/anime-notifications/server/api-rate-limit';
import {
  AuthenticateDevice,
  CreateDeviceSession,
  DEVICE_COOKIE_NAME,
  DEVICE_COOKIE_OPTIONS
} from '@/features/anime-notifications/server/device-session';
import { ValidateMutationRequest } from '@/features/anime-notifications/server/request-security';
import {
  CreateApiError,
  CreateApiSuccess,
  type ApiFailure,
  type ApiSuccess
} from '@/features/anime-notifications/types/api';

interface DeviceSessionResponse {
  readonly device_id: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiSuccess<DeviceSessionResponse> | ApiFailure>> {
  if (!ValidateMutationRequest(request)) {
    return CreateApiError('INVALID_REQUEST', 'คำขอไม่ถูกต้อง', 400);
  }

  try {
    const existing_device_token =
      request.cookies.get(DEVICE_COOKIE_NAME)?.value ?? null;
    const existing_device = await AuthenticateDevice(request);
    const is_request_allowed = await EnforceRequestRateLimit(
      request,
      'MUTATION',
      existing_device?.device_id ?? null
    );

    if (!is_request_allowed) {
      return CreateApiError(
        'RATE_LIMITED',
        'มีคำขอจากอุปกรณ์นี้มากเกินไป กรุณารอสักครู่แล้วลองใหม่',
        429
      );
    }

    const device_session = existing_device ?? (await CreateDeviceSession());
    const response = CreateApiSuccess({
      device_id: device_session.device_id
    });
    const response_device_token =
      'device_token' in device_session
        ? device_session.device_token
        : existing_device_token;

    if (response_device_token !== null) {
      response.cookies.set(
        DEVICE_COOKIE_NAME,
        response_device_token,
        DEVICE_COOKIE_OPTIONS
      );
    }

    return response;
  } catch {
    return CreateApiError(
      'SERVICE_UNAVAILABLE',
      'ยังไม่สามารถสร้างเซสชันสำหรับอุปกรณ์นี้ได้ กรุณาลองใหม่',
      503
    );
  }
}

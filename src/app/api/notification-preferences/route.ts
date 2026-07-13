import type { NextRequest, NextResponse } from 'next/server';

import {
  NotificationPreferencesMutationSchema,
  ReadNotificationPreferences,
  WriteNotificationPreferences
} from '@/features/anime-notifications/server';
import {
  AuthorizeDeviceRequest,
  CreateDeviceRouteErrorResponse
} from '@/features/device-session/server';
import {
  CreateApiError,
  CreateApiSuccess,
  ReadJsonRequestBody,
  ValidateMutationRequest
} from '@/lib/api/server';

import type { NotificationPreferencesResponse } from '@/features/anime-notifications/server';
import type { ApiFailure, ApiSuccess } from '@/types/api';

type NotificationPreferencesApiResponse = NextResponse<
  ApiSuccess<NotificationPreferencesResponse> | ApiFailure
>;

export async function GET(
  request: NextRequest
): Promise<NotificationPreferencesApiResponse> {
  try {
    const authenticated_device = await AuthorizeDeviceRequest(request, 'READ');
    const preferences = await ReadNotificationPreferences(
      authenticated_device.device_id
    );

    return CreateApiSuccess(preferences);
  } catch (error) {
    return CreateDeviceRouteErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest
): Promise<NotificationPreferencesApiResponse> {
  if (!ValidateMutationRequest(request)) {
    return CreateApiError('INVALID_REQUEST', 'คำขอไม่ถูกต้อง', 400);
  }

  try {
    const authenticated_device = await AuthorizeDeviceRequest(
      request,
      'MUTATION'
    );
    const request_body = await ReadJsonRequestBody(request);
    const parse_result =
      NotificationPreferencesMutationSchema.safeParse(request_body);

    if (!parse_result.success) {
      return CreateApiError(
        'INVALID_REQUEST',
        'การตั้งค่าการแจ้งเตือนไม่ถูกต้อง',
        400
      );
    }

    const preferences = await WriteNotificationPreferences(
      authenticated_device.device_id,
      parse_result.data
    );

    return CreateApiSuccess(preferences);
  } catch (error) {
    return CreateDeviceRouteErrorResponse(error);
  }
}

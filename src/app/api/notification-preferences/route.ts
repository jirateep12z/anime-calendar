import type { NextRequest, NextResponse } from 'next/server';

import {
  ReadNotificationPreferences,
  WriteNotificationPreferences
} from '@/features/anime-notifications/server/notification-repository';
import {
  AuthorizeNotificationRequest,
  CreateNotificationRouteErrorResponse
} from '@/features/anime-notifications/server/notification-route-security';
import {
  ReadJsonRequestBody,
  ValidateMutationRequest
} from '@/features/anime-notifications/server/request-security';
import type {
  ApiFailure,
  ApiSuccess
} from '@/features/anime-notifications/types/api';
import {
  CreateApiError,
  CreateApiSuccess
} from '@/features/anime-notifications/types/api';
import { NotificationPreferencesMutationSchema } from '@/features/anime-notifications/validation/notification-api-schema';

import type { NotificationPreferencesResponse } from '@/features/anime-notifications/server/notification-repository';

type NotificationPreferencesApiResponse = NextResponse<
  ApiSuccess<NotificationPreferencesResponse> | ApiFailure
>;

export async function GET(
  request: NextRequest
): Promise<NotificationPreferencesApiResponse> {
  try {
    const authenticated_device = await AuthorizeNotificationRequest(
      request,
      'READ'
    );
    const preferences = await ReadNotificationPreferences(
      authenticated_device.device_id
    );

    return CreateApiSuccess(preferences);
  } catch (error) {
    return CreateNotificationRouteErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest
): Promise<NotificationPreferencesApiResponse> {
  if (!ValidateMutationRequest(request)) {
    return CreateApiError('INVALID_REQUEST', 'คำขอไม่ถูกต้อง', 400);
  }

  try {
    const authenticated_device = await AuthorizeNotificationRequest(
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
    return CreateNotificationRouteErrorResponse(error);
  }
}

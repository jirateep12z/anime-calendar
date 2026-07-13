import type { NextRequest, NextResponse } from 'next/server';

import {
  DeletePushSubscription,
  ReplacePushSubscription
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
import { PushSubscriptionSchema } from '@/features/anime-notifications/validation/notification-api-schema';

interface PushSubscriptionResponse {
  readonly is_subscribed: boolean;
}

type PushSubscriptionApiResponse = NextResponse<
  ApiSuccess<PushSubscriptionResponse> | ApiFailure
>;

export async function POST(
  request: NextRequest
): Promise<PushSubscriptionApiResponse> {
  if (!ValidateMutationRequest(request)) {
    return CreateApiError('INVALID_REQUEST', 'คำขอไม่ถูกต้อง', 400);
  }

  try {
    const authenticated_device = await AuthorizeNotificationRequest(
      request,
      'MUTATION'
    );
    const request_body = await ReadJsonRequestBody(request);
    const parse_result = PushSubscriptionSchema.safeParse(request_body);

    if (!parse_result.success) {
      return CreateApiError(
        'INVALID_REQUEST',
        'ข้อมูล Push subscription ไม่ถูกต้อง',
        400
      );
    }

    await ReplacePushSubscription(
      authenticated_device.device_id,
      parse_result.data
    );

    return CreateApiSuccess({ is_subscribed: true }, 201);
  } catch (error) {
    return CreateNotificationRouteErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest
): Promise<PushSubscriptionApiResponse> {
  if (!ValidateMutationRequest(request)) {
    return CreateApiError('INVALID_REQUEST', 'คำขอไม่ถูกต้อง', 400);
  }

  try {
    const authenticated_device = await AuthorizeNotificationRequest(
      request,
      'MUTATION'
    );

    await DeletePushSubscription(authenticated_device.device_id);

    return CreateApiSuccess({ is_subscribed: false });
  } catch (error) {
    return CreateNotificationRouteErrorResponse(error);
  }
}

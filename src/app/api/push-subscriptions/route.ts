import type { NextRequest, NextResponse } from 'next/server';

import {
  DeletePushSubscription,
  PushSubscriptionSchema,
  ReplacePushSubscription
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

import type { ApiFailure, ApiSuccess } from '@/types/api';

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
    const authenticated_device = await AuthorizeDeviceRequest(
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
    return CreateDeviceRouteErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest
): Promise<PushSubscriptionApiResponse> {
  if (!ValidateMutationRequest(request)) {
    return CreateApiError('INVALID_REQUEST', 'คำขอไม่ถูกต้อง', 400);
  }

  try {
    const authenticated_device = await AuthorizeDeviceRequest(
      request,
      'MUTATION'
    );

    await DeletePushSubscription(authenticated_device.device_id);

    return CreateApiSuccess({ is_subscribed: false });
  } catch (error) {
    return CreateDeviceRouteErrorResponse(error);
  }
}

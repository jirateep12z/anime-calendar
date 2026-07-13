import type { NextRequest, NextResponse } from 'next/server';

import {
  BookmarkMutationSchema,
  BookmarkRouteParameterSchema,
  WriteBookmarkState,
  type BookmarkState
} from '@/features/anime-bookmarks/server';
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

interface BookmarkRouteContext {
  readonly params: Promise<{ readonly 'anilist-media-id': string }>;
}

export async function PUT(
  request: NextRequest,
  context: BookmarkRouteContext
): Promise<NextResponse<ApiSuccess<BookmarkState> | ApiFailure>> {
  if (!ValidateMutationRequest(request)) {
    return CreateApiError('INVALID_REQUEST', 'คำขอไม่ถูกต้อง', 400);
  }

  try {
    const authenticated_device = await AuthorizeDeviceRequest(
      request,
      'MUTATION'
    );
    const route_parameters = await context.params;
    const media_id_result = BookmarkRouteParameterSchema.safeParse(
      route_parameters['anilist-media-id']
    );
    const request_body = await ReadJsonRequestBody(request);
    const mutation_result = BookmarkMutationSchema.safeParse(request_body);

    if (!media_id_result.success || !mutation_result.success) {
      return CreateApiError(
        'INVALID_REQUEST',
        'ข้อมูลบุ๊กมาร์กไม่ถูกต้อง',
        400
      );
    }

    const bookmark_state = await WriteBookmarkState(
      authenticated_device.device_id,
      media_id_result.data,
      mutation_result.data
    );

    return CreateApiSuccess(bookmark_state);
  } catch (error) {
    return CreateDeviceRouteErrorResponse(error);
  }
}

import type { NextRequest, NextResponse } from 'next/server';

import {
  ReadBookmarkPage,
  type BookmarkPage
} from '@/features/anime-notifications/server/notification-repository';
import {
  AuthorizeNotificationRequest,
  CreateNotificationRouteErrorResponse
} from '@/features/anime-notifications/server/notification-route-security';
import type {
  ApiFailure,
  ApiSuccess
} from '@/features/anime-notifications/types/api';
import {
  CreateApiError,
  CreateApiSuccess
} from '@/features/anime-notifications/types/api';
import { BookmarkQuerySchema } from '@/features/anime-notifications/validation/notification-api-schema';

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiSuccess<BookmarkPage> | ApiFailure>> {
  try {
    const authenticated_device = await AuthorizeNotificationRequest(
      request,
      'READ'
    );
    const query_parameters = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );
    const parse_result = BookmarkQuerySchema.safeParse(query_parameters);

    if (!parse_result.success) {
      return CreateApiError(
        'INVALID_REQUEST',
        'ตัวเลือกการอ่านบุ๊กมาร์กไม่ถูกต้อง',
        400
      );
    }

    const bookmark_page = await ReadBookmarkPage(
      authenticated_device.device_id,
      parse_result.data.cursor,
      parse_result.data.limit
    );

    return CreateApiSuccess(bookmark_page);
  } catch (error) {
    return CreateNotificationRouteErrorResponse(error);
  }
}

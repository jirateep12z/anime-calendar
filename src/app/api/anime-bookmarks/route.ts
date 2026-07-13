import type { NextRequest, NextResponse } from 'next/server';

import {
  BookmarkQuerySchema,
  ReadBookmarkPage,
  type BookmarkPage
} from '@/features/anime-bookmarks/server';
import {
  AuthorizeDeviceRequest,
  CreateDeviceRouteErrorResponse
} from '@/features/device-session/server';
import { CreateApiError, CreateApiSuccess } from '@/lib/api/server';

import type { ApiFailure, ApiSuccess } from '@/types/api';

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiSuccess<BookmarkPage> | ApiFailure>> {
  try {
    const authenticated_device = await AuthorizeDeviceRequest(request, 'READ');
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
    return CreateDeviceRouteErrorResponse(error);
  }
}

import { timingSafeEqual } from 'node:crypto';

import type { NextRequest, NextResponse } from 'next/server';

import {
  ReadNotificationEnvironment,
  SyncNotificationSchedule
} from '@/features/anime-notifications/server';
import { CreateApiError, CreateApiSuccess } from '@/lib/api/server';

import type { ApiFailure, ApiSuccess } from '@/types/api';

interface ScheduleSyncResponse {
  readonly synced_count: number;
  readonly synced_at: string;
}

export function IsAuthorizedCronRequest(
  request: NextRequest,
  cron_secret: string
): boolean {
  const authorization_header = request.headers.get('authorization');
  const expected_header = `Bearer ${cron_secret}`;

  if (
    authorization_header === null ||
    authorization_header.length !== expected_header.length
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(authorization_header),
    Buffer.from(expected_header)
  );
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiSuccess<ScheduleSyncResponse> | ApiFailure>> {
  const environment = ReadNotificationEnvironment();

  if (!IsAuthorizedCronRequest(request, environment.NOTIFICATION_CRON_SECRET)) {
    return CreateApiError('UNAUTHORIZED', 'ไม่ได้รับอนุญาต', 401);
  }

  try {
    const sync_result = await SyncNotificationSchedule(new Date());

    return CreateApiSuccess(sync_result);
  } catch (error) {
    console.error({
      event_name: 'NOTIFICATION_SCHEDULE_SYNC_FAILED',
      error_name: error instanceof Error ? error.name : 'UnknownError'
    });

    return CreateApiError(
      'SERVICE_UNAVAILABLE',
      'ยังไม่สามารถอัปเดตตารางแจ้งเตือนได้ กรุณาลองใหม่',
      503
    );
  }
}

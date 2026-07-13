import { z } from 'zod';

import type { ApiErrorCode } from '../types/api';
import type {
  BookmarkMutation,
  NotificationPreferences
} from '../types/notification';
import type { PushSubscriptionInput } from '../validation/notification-api-schema';

const ApiFailureSchema = z.strictObject({
  data: z.null(),
  error: z.strictObject({
    code: z.enum([
      'INVALID_REQUEST',
      'UNAUTHORIZED',
      'RATE_LIMITED',
      'SERVICE_UNAVAILABLE'
    ]),
    message: z.string()
  })
});
const NotificationPreferencesResponseSchema = z.strictObject({
  is_notification_enabled: z.boolean(),
  notification_mode: z.enum(['ALL', 'BOOKMARKS']),
  is_adult_confirmed: z.boolean(),
  is_adult_content_visible: z.boolean(),
  bookmark_count: z.number().int().nonnegative()
});
const BookmarkPageSchema = z.strictObject({
  anilist_media_ids: z.array(z.number().int().positive()),
  next_cursor: z.number().int().positive().nullable()
});
const PushSubscriptionResponseSchema = z.strictObject({
  is_subscribed: z.boolean()
});
const DeviceSessionResponseSchema = z.strictObject({
  device_id: z.uuid()
});

export type NotificationClientErrorCode =
  | ApiErrorCode
  | 'NETWORK'
  | 'INVALID_RESPONSE'
  | 'PERMISSION_DENIED'
  | 'PUSH_SUBSCRIPTION_FAILED'
  | 'PARTIAL_UNSUBSCRIBE_FAILED';

export class NotificationClientError extends Error {
  public readonly error_code: NotificationClientErrorCode;
  public readonly http_status: number | null;
  public readonly cause: unknown;

  public constructor(
    error_code: NotificationClientErrorCode,
    message: string,
    http_status: number | null = null,
    cause: unknown = null
  ) {
    super(message);
    this.name = 'NotificationClientError';
    this.error_code = error_code;
    this.http_status = http_status;
    this.cause = cause;
  }
}

interface ApiSuccessBody<T> {
  readonly data: T;
  readonly error: null;
}

async function RequestApi<T>(
  request_url: string,
  response_schema: z.ZodType<T>,
  request_init?: RequestInit
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(request_url, {
      credentials: 'same-origin',
      ...request_init
    });
  } catch (error) {
    throw new NotificationClientError(
      'NETWORK',
      'ไม่สามารถเชื่อมต่อบริการแจ้งเตือนได้',
      null,
      error
    );
  }

  let response_body: unknown;

  try {
    response_body = (await response.json()) as unknown;
  } catch (error) {
    throw new NotificationClientError(
      'INVALID_RESPONSE',
      'บริการแจ้งเตือนส่งข้อมูลที่อ่านไม่ได้',
      response.status,
      error
    );
  }

  if (!response.ok) {
    const failure_result = ApiFailureSchema.safeParse(response_body);

    if (failure_result.success) {
      throw new NotificationClientError(
        failure_result.data.error.code,
        failure_result.data.error.message,
        response.status
      );
    }

    throw new NotificationClientError(
      'INVALID_RESPONSE',
      'บริการแจ้งเตือนส่งข้อผิดพลาดที่อ่านไม่ได้',
      response.status
    );
  }

  const success_result = z
    .strictObject({ data: response_schema, error: z.null() })
    .safeParse(response_body);

  if (!success_result.success) {
    throw new NotificationClientError(
      'INVALID_RESPONSE',
      'บริการแจ้งเตือนส่งข้อมูลไม่ตรงรูปแบบ',
      response.status
    );
  }

  return (success_result.data as ApiSuccessBody<T>).data;
}

function CreateJsonMutation(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body: unknown
): RequestInit {
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  };
}

export function IsRetryableNotificationError(error: unknown): boolean {
  return (
    error instanceof NotificationClientError &&
    (error.error_code === 'NETWORK' ||
      error.error_code === 'RATE_LIMITED' ||
      error.error_code === 'SERVICE_UNAVAILABLE')
  );
}

export async function EnsureDeviceSession(): Promise<string> {
  const response = await RequestApi(
    '/api/device-session',
    DeviceSessionResponseSchema,
    CreateJsonMutation('POST', {})
  );

  return response.device_id;
}

export async function ReadNotificationPreferences(): Promise<
  NotificationPreferences & { readonly bookmark_count: number }
> {
  return RequestApi(
    '/api/notification-preferences',
    NotificationPreferencesResponseSchema
  );
}

export async function WriteNotificationPreferences(
  preferences: NotificationPreferences
): Promise<NotificationPreferences & { readonly bookmark_count: number }> {
  return RequestApi(
    '/api/notification-preferences',
    NotificationPreferencesResponseSchema,
    CreateJsonMutation('PATCH', preferences)
  );
}

export async function ReadAllBookmarkMediaIds(): Promise<ReadonlySet<number>> {
  const bookmarked_media_ids = new Set<number>();
  let next_cursor: number | null = null;

  do {
    const search_parameters = new URLSearchParams({ limit: '500' });

    if (next_cursor !== null) {
      search_parameters.set('cursor', String(next_cursor));
    }

    const bookmark_page = await RequestApi(
      `/api/anime-bookmarks?${search_parameters}`,
      BookmarkPageSchema
    );

    bookmark_page.anilist_media_ids.forEach(anilist_media_id =>
      bookmarked_media_ids.add(anilist_media_id)
    );
    next_cursor = bookmark_page.next_cursor;
  } while (next_cursor !== null);

  return Object.freeze(bookmarked_media_ids);
}

export async function PutBookmarkState(
  mutation: BookmarkMutation
): Promise<void> {
  await RequestApi(
    `/api/anime-bookmarks/${mutation.anilist_media_id}`,
    z.unknown(),
    CreateJsonMutation('PUT', {
      is_bookmarked: mutation.is_bookmarked,
      client_mutation_id: mutation.client_mutation_id,
      client_sequence: mutation.client_sequence
    })
  );
}

export async function WritePushSubscription(
  push_subscription: PushSubscriptionInput
): Promise<void> {
  await RequestApi(
    '/api/push-subscriptions',
    PushSubscriptionResponseSchema,
    CreateJsonMutation('POST', push_subscription)
  );
}

export async function DeletePushSubscription(): Promise<void> {
  await RequestApi(
    '/api/push-subscriptions',
    PushSubscriptionResponseSchema,
    CreateJsonMutation('DELETE', {})
  );
}

import { OpenNotificationDatabase } from '@/features/anime-notifications/storage/notification-database';

import type { NotificationLocalState } from '@/features/anime-notifications/types/notification';

export interface NotificationPayload {
  readonly title: string;
  readonly body: string;
  readonly tag: string;
  readonly icon: string;
  readonly image?: string;
  readonly data: {
    readonly url: string;
    readonly anilist_schedule_id: number;
    readonly is_adult: boolean;
  };
}

function IsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function IsNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function ParseNotificationPayload(
  value: unknown
): NotificationPayload | null {
  if (!IsRecord(value) || !IsRecord(value.data)) {
    return null;
  }

  if (
    !IsNonEmptyString(value.title) ||
    !IsNonEmptyString(value.body) ||
    !IsNonEmptyString(value.tag) ||
    !IsNonEmptyString(value.icon) ||
    (value.image !== undefined && !IsNonEmptyString(value.image)) ||
    !IsNonEmptyString(value.data.url) ||
    !Number.isSafeInteger(value.data.anilist_schedule_id) ||
    Number(value.data.anilist_schedule_id) <= 0 ||
    typeof value.data.is_adult !== 'boolean'
  ) {
    return null;
  }

  return Object.freeze({
    title: value.title,
    body: value.body,
    tag: value.tag,
    icon: value.icon,
    ...(value.image === undefined ? {} : { image: value.image }),
    data: Object.freeze({
      url: value.data.url,
      anilist_schedule_id: Number(value.data.anilist_schedule_id),
      is_adult: value.data.is_adult
    })
  });
}

export function ShouldDisplayPush(
  payload: NotificationPayload,
  local_state: NotificationLocalState | null
): boolean {
  if (local_state?.is_notification_enabled !== true) {
    return false;
  }

  if (!payload.data.is_adult) {
    return true;
  }

  return local_state.is_adult_confirmed && local_state.is_adult_content_visible;
}

export async function ReadWorkerNotificationLocalState(): Promise<NotificationLocalState | null> {
  const database = await OpenNotificationDatabase();

  return (await database.get('notification_local_state', 'current')) ?? null;
}

export function CreateSafeNotificationTarget(
  target_path: string,
  origin: string
): string | null {
  try {
    const target_url = new URL(target_path, origin);

    return target_url.origin === origin ? target_url.href : null;
  } catch {
    return null;
  }
}

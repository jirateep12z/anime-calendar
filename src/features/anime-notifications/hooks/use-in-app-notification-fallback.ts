'use client';

import { useEffect, useRef } from 'react';

import type { ScheduleEntry } from '@/features/anime-calendar/types/schedule';
import { toast } from 'sonner';
import {
  ReadLocalDeliveryScheduleIds,
  RecordLocalDelivery
} from '../storage/local-delivery-history';
import { UseNotifications } from './use-notifications';

const DELIVERY_GRACE_SECONDS = 5 * 60;

interface DueScheduleInput {
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly now_seconds: number;
  readonly displayed_schedule_ids: ReadonlySet<number>;
  readonly bookmarked_media_ids: ReadonlySet<number>;
  readonly notification_mode: 'ALL' | 'BOOKMARKS';
  readonly is_adult_confirmed: boolean;
  readonly is_adult_content_visible: boolean;
}

export function FindDueInAppNotifications({
  schedule_entries,
  now_seconds,
  displayed_schedule_ids,
  bookmarked_media_ids,
  notification_mode,
  is_adult_confirmed,
  is_adult_content_visible
}: DueScheduleInput): readonly ScheduleEntry[] {
  return schedule_entries.filter(
    schedule_entry =>
      schedule_entry.airing_at <= now_seconds &&
      schedule_entry.airing_at > now_seconds - DELIVERY_GRACE_SECONDS &&
      !displayed_schedule_ids.has(schedule_entry.anilist_schedule_id) &&
      (notification_mode === 'ALL' ||
        bookmarked_media_ids.has(schedule_entry.anilist_media_id)) &&
      (!schedule_entry.is_adult ||
        (is_adult_confirmed && is_adult_content_visible))
  );
}

export function UseInAppNotificationFallback(
  schedule_entries: readonly ScheduleEntry[],
  now_seconds: number,
  OpenRelease: (anilist_schedule_id: number) => void
): void {
  const { preferences, bookmarked_media_ids, is_push_subscribed, is_hydrated } =
    UseNotifications();
  const is_delivery_running_ref = useRef(false);

  useEffect(() => {
    if (
      !is_hydrated ||
      !preferences.is_notification_enabled ||
      is_push_subscribed ||
      is_delivery_running_ref.current
    ) {
      return;
    }

    is_delivery_running_ref.current = true;

    async function DisplayDueNotifications() {
      try {
        const now_milliseconds = now_seconds * 1_000;
        const displayed_schedule_ids =
          await ReadLocalDeliveryScheduleIds(now_milliseconds);
        const due_schedule_entries = FindDueInAppNotifications({
          schedule_entries,
          now_seconds,
          displayed_schedule_ids,
          bookmarked_media_ids,
          notification_mode: preferences.notification_mode,
          is_adult_confirmed: preferences.is_adult_confirmed,
          is_adult_content_visible: preferences.is_adult_content_visible
        });

        for (const schedule_entry of due_schedule_entries) {
          await RecordLocalDelivery(
            schedule_entry.anilist_schedule_id,
            now_milliseconds
          );
          toast(schedule_entry.title.primary, {
            description: `ตอน ${schedule_entry.episode_number} • ${schedule_entry.airing_time} น.`,
            action: {
              label: 'ดูรายละเอียด',
              onClick: () => OpenRelease(schedule_entry.anilist_schedule_id)
            }
          });
        }
      } finally {
        is_delivery_running_ref.current = false;
      }
    }

    void DisplayDueNotifications();
  }, [
    OpenRelease,
    bookmarked_media_ids,
    is_hydrated,
    is_push_subscribed,
    now_seconds,
    preferences,
    schedule_entries
  ]);
}

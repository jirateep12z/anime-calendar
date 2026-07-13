import 'server-only';

import { FetchAniListSchedule } from '@/features/anime-calendar/api/anilist-client';
import { TransformAniListSchedules } from '@/features/anime-calendar/services/transform-schedule';
import type {
  ScheduleEntry,
  ScheduleRange
} from '@/features/anime-calendar/types/schedule';
import { CreateBangkokScheduleRange } from '@/features/anime-calendar/utils/schedule-time';

import { ReadSupabaseAdminClient } from './supabase-admin';

const ANILIST_SYNC_TIMEOUT_MILLISECONDS = 12_000;

export interface NotificationRelease {
  readonly anilist_schedule_id: number;
  readonly anilist_media_id: number;
  readonly title: string;
  readonly episode_number: number;
  readonly airing_at: string;
  readonly airing_time_bangkok: string;
  readonly is_adult: boolean;
  readonly cover_image_url: string | null;
  readonly synced_at: string;
}

export interface NotificationScheduleSyncResult {
  readonly synced_count: number;
  readonly synced_at: string;
}

export interface NotificationScheduleSyncDependencies {
  readonly FetchAniListSchedule: (
    range: ScheduleRange,
    signal: AbortSignal
  ) => Promise<readonly unknown[]>;
  readonly TransformAniListSchedules: (
    raw_schedules: readonly unknown[]
  ) => readonly ScheduleEntry[];
  readonly UpsertNotificationReleases: (
    notification_releases: readonly NotificationRelease[]
  ) => Promise<void>;
}

export class NotificationScheduleSyncError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'NotificationScheduleSyncError';
  }
}

export function TransformScheduleEntriesToNotificationReleases(
  schedule_entries: readonly ScheduleEntry[],
  synced_at: Date
): readonly NotificationRelease[] {
  const synced_at_iso = synced_at.toISOString();

  return Object.freeze(
    schedule_entries.map(schedule_entry =>
      Object.freeze({
        anilist_schedule_id: schedule_entry.anilist_schedule_id,
        anilist_media_id: schedule_entry.anilist_media_id,
        title: schedule_entry.title.primary,
        episode_number: schedule_entry.episode_number,
        airing_at: new Date(schedule_entry.airing_at * 1_000).toISOString(),
        airing_time_bangkok: schedule_entry.airing_time,
        is_adult: schedule_entry.is_adult,
        cover_image_url: schedule_entry.cover_image_url,
        synced_at: synced_at_iso
      })
    )
  );
}

export async function UpsertNotificationReleases(
  notification_releases: readonly NotificationRelease[]
): Promise<void> {
  if (notification_releases.length === 0) {
    return;
  }

  const { error } = await ReadSupabaseAdminClient()
    .from('anime_releases')
    .upsert(notification_releases, { onConflict: 'anilist_schedule_id' });

  if (error !== null) {
    throw new NotificationScheduleSyncError(
      'Unable to upsert notification releases'
    );
  }
}

const DEFAULT_DEPENDENCIES: NotificationScheduleSyncDependencies =
  Object.freeze({
    FetchAniListSchedule,
    TransformAniListSchedules,
    UpsertNotificationReleases
  });

export async function SyncNotificationSchedule(
  now: Date,
  dependencies: NotificationScheduleSyncDependencies = DEFAULT_DEPENDENCIES
): Promise<NotificationScheduleSyncResult> {
  const schedule_range = CreateBangkokScheduleRange(now);
  const raw_schedules = await dependencies.FetchAniListSchedule(
    schedule_range,
    AbortSignal.timeout(ANILIST_SYNC_TIMEOUT_MILLISECONDS)
  );
  const schedule_entries =
    dependencies.TransformAniListSchedules(raw_schedules);
  const notification_releases = TransformScheduleEntriesToNotificationReleases(
    schedule_entries,
    now
  );

  await dependencies.UpsertNotificationReleases(notification_releases);

  return Object.freeze({
    synced_count: notification_releases.length,
    synced_at: now.toISOString()
  });
}

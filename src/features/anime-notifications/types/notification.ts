import type { ScheduleEntry, ScheduleRange } from '@/features/anime-schedule';
import type {
  StoredNotificationMode,
  StoredNotificationPreferences,
  StoredPreferenceMutation
} from '@/features/offline-storage';

export type NotificationMode = StoredNotificationMode;
export type NotificationPreferences = StoredNotificationPreferences;

export type PreferenceMutation = StoredPreferenceMutation;
export type NotificationLocalState = NotificationPreferences;

export type NotificationCapabilityStatus =
  'SUPPORTED' | 'IOS_INSTALL_REQUIRED' | 'PERMISSION_DENIED' | 'UNSUPPORTED';

export interface NotificationContextValue {
  readonly preferences: NotificationPreferences;
  readonly capability_status: NotificationCapabilityStatus;
  readonly is_push_subscribed: boolean;
  readonly sync_error_message: string | null;
  readonly EnableNotifications: () => Promise<void>;
  readonly DisableNotifications: () => Promise<void>;
  readonly ChangeNotificationMode: (
    notification_mode: NotificationMode
  ) => Promise<void>;
  readonly SyncAdultPreference: (
    is_adult_confirmed: boolean,
    is_adult_content_visible: boolean
  ) => Promise<void>;
  readonly RetryPendingMutations: () => Promise<void>;
}

export interface NotificationPreferencesResponse {
  readonly is_notification_enabled: boolean;
  readonly notification_mode: NotificationMode;
  readonly is_adult_confirmed: boolean;
  readonly is_adult_content_visible: boolean;
  readonly bookmark_count: number;
}

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

export interface OutboxReplayResult {
  readonly completed_count: number;
  readonly blocking_error: unknown | null;
}

export interface LocalDeliveryHistoryEntry {
  readonly anilist_schedule_id: number;
  readonly displayed_at: number;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences =
  Object.freeze({
    is_notification_enabled: false,
    notification_mode: 'BOOKMARKS',
    is_adult_confirmed: false,
    is_adult_content_visible: false
  });

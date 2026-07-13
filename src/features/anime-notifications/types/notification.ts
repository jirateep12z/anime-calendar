import type {
  ScheduleEntry,
  ScheduleTitle
} from '@/features/anime-calendar/types/schedule';
import type { NotificationMode } from '../validation/notification-api-schema';

export type { NotificationMode };

export interface NotificationPreferences {
  readonly is_notification_enabled: boolean;
  readonly notification_mode: NotificationMode;
  readonly is_adult_confirmed: boolean;
  readonly is_adult_content_visible: boolean;
}

export interface BookmarkMutation {
  readonly client_mutation_id: string;
  readonly client_sequence: number;
  readonly anilist_media_id: number;
  readonly is_bookmarked: boolean;
  readonly created_at: number;
}

export type BookmarkMediaStatus =
  'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS' | null;

export interface BookmarkCatalogEntry {
  readonly anilist_media_id: number;
  readonly title: ScheduleTitle;
  readonly description: string | null;
  readonly cover_image_url: string | null;
  readonly format: string | null;
  readonly total_episodes: number | null;
  readonly duration_minutes: number | null;
  readonly media_status: BookmarkMediaStatus;
  readonly is_adult: boolean;
  readonly genres: readonly string[];
  readonly average_score: number | null;
  readonly popularity: number | null;
  readonly anilist_url: string | null;
  readonly latest_schedule_entry: ScheduleEntry | null;
  readonly updated_at: number;
}

export interface PreferenceMutation {
  readonly client_mutation_id: string;
  readonly created_at: number;
  readonly preferences: NotificationPreferences;
}

export type NotificationLocalState = NotificationPreferences;

export type NotificationCapabilityStatus =
  'SUPPORTED' | 'IOS_INSTALL_REQUIRED' | 'PERMISSION_DENIED' | 'UNSUPPORTED';

export interface NotificationContextValue {
  readonly bookmarked_media_ids: ReadonlySet<number>;
  readonly pending_media_ids: ReadonlySet<number>;
  readonly bookmark_catalog_entries: ReadonlyMap<number, BookmarkCatalogEntry>;
  readonly preferences: NotificationPreferences;
  readonly capability_status: NotificationCapabilityStatus;
  readonly bookmark_count: number;
  readonly is_push_subscribed: boolean;
  readonly is_hydrated: boolean;
  readonly is_catalog_refreshing: boolean;
  readonly sync_error_message: string | null;
  readonly catalog_error_message: string | null;
  readonly ToggleBookmark: (
    anilist_media_id: number,
    catalog_entry?: BookmarkCatalogEntry
  ) => Promise<void>;
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

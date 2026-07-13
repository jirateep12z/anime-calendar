import type { AnimeCatalogEntry } from '@/features/anime-schedule';

export type StoredNotificationMode = 'ALL' | 'BOOKMARKS';

export interface StoredNotificationPreferences {
  readonly is_notification_enabled: boolean;
  readonly notification_mode: StoredNotificationMode;
  readonly is_adult_confirmed: boolean;
  readonly is_adult_content_visible: boolean;
}

export interface StoredBookmarkMutation {
  readonly client_mutation_id: string;
  readonly client_sequence: number;
  readonly anilist_media_id: number;
  readonly is_bookmarked: boolean;
  readonly created_at: number;
}

export interface StoredPreferenceMutation {
  readonly client_mutation_id: string;
  readonly created_at: number;
  readonly preferences: StoredNotificationPreferences;
}

export interface StoredBookmarkSnapshotRecord {
  readonly anilist_media_id: number;
  readonly is_bookmarked: boolean;
}

export interface StoredMetadataRecord {
  readonly key: string;
  readonly numeric_value: number;
}

export interface StoredLocalDeliveryHistoryEntry {
  readonly anilist_schedule_id: number;
  readonly displayed_at: number;
}

export type StoredBookmarkCatalogEntry = AnimeCatalogEntry;

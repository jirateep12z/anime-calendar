import type { AnimeCatalogEntry } from '@/features/anime-schedule';
import type { StoredBookmarkMutation } from '@/features/offline-storage';

export type BookmarkCatalogEntry = AnimeCatalogEntry;
export type BookmarkMutation = StoredBookmarkMutation;

export interface BookmarkContextValue {
  readonly bookmarked_media_ids: ReadonlySet<number>;
  readonly pending_media_ids: ReadonlySet<number>;
  readonly bookmark_catalog_entries: ReadonlyMap<number, BookmarkCatalogEntry>;
  readonly bookmark_count: number;
  readonly is_hydrated: boolean;
  readonly is_catalog_refreshing: boolean;
  readonly sync_error_message: string | null;
  readonly catalog_error_message: string | null;
  readonly ToggleBookmark: (
    anilist_media_id: number,
    catalog_entry?: BookmarkCatalogEntry
  ) => Promise<void>;
  readonly RetryPendingMutations: () => Promise<void>;
}

export interface BookmarkState {
  readonly device_id: string;
  readonly anilist_media_id: number;
  readonly is_bookmarked: boolean;
  readonly client_mutation_id: string;
  readonly client_sequence: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface BookmarkPage {
  readonly anilist_media_ids: readonly number[];
  readonly next_cursor: number | null;
}

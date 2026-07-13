import { FetchAniListMediaCatalog } from '@/features/anime-calendar/api/anilist-client';
import { WriteBookmarkCatalogEntries } from '../storage/bookmark-catalog';

import type { BookmarkCatalogEntry } from '../types/notification';

const BOOKMARK_CATALOG_BATCH_SIZE = 50;

export const BOOKMARK_CATALOG_MAX_AGE_MILLISECONDS = 24 * 60 * 60 * 1_000;

export function SelectStaleBookmarkMediaIds(
  anilist_media_ids: ReadonlySet<number>,
  cached_entries: ReadonlyMap<number, BookmarkCatalogEntry>,
  now_milliseconds: number = Date.now()
): ReadonlySet<number> {
  const oldest_fresh_timestamp =
    now_milliseconds - BOOKMARK_CATALOG_MAX_AGE_MILLISECONDS;

  return new Set(
    [...anilist_media_ids].filter(anilist_media_id => {
      const cached_entry = cached_entries.get(anilist_media_id);

      return (
        cached_entry === undefined ||
        cached_entry.updated_at < oldest_fresh_timestamp
      );
    })
  );
}

function CreateMediaIdBatches(
  anilist_media_ids: readonly number[]
): readonly (readonly number[])[] {
  const media_id_batches: number[][] = [];

  for (
    let media_id_index = 0;
    media_id_index < anilist_media_ids.length;
    media_id_index += BOOKMARK_CATALOG_BATCH_SIZE
  ) {
    media_id_batches.push(
      anilist_media_ids.slice(
        media_id_index,
        media_id_index + BOOKMARK_CATALOG_BATCH_SIZE
      )
    );
  }

  return Object.freeze(media_id_batches);
}

export async function RefreshBookmarkCatalog(
  anilist_media_ids: ReadonlySet<number>,
  cached_entries: ReadonlyMap<number, BookmarkCatalogEntry>,
  signal: AbortSignal
): Promise<ReadonlyMap<number, BookmarkCatalogEntry>> {
  const stale_media_ids = SelectStaleBookmarkMediaIds(
    anilist_media_ids,
    cached_entries
  );

  if (stale_media_ids.size === 0) return cached_entries;

  const refreshed_batches = await Promise.all(
    CreateMediaIdBatches([...stale_media_ids]).map(media_id_batch =>
      FetchAniListMediaCatalog(media_id_batch, signal)
    )
  );
  const refreshed_entries = refreshed_batches.flat();

  if (refreshed_entries.length > 0) {
    await WriteBookmarkCatalogEntries(refreshed_entries);
  }

  const merged_entries = new Map(cached_entries);

  refreshed_entries.forEach(catalog_entry => {
    if (anilist_media_ids.has(catalog_entry.anilist_media_id)) {
      merged_entries.set(catalog_entry.anilist_media_id, catalog_entry);
    }
  });

  return merged_entries;
}

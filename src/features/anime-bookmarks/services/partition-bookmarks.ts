import type { BookmarkCatalogEntry } from '../types/bookmark';

interface BookmarkPartition {
  readonly main_entries: readonly BookmarkCatalogEntry[];
  readonly completed_entries: readonly BookmarkCatalogEntry[];
  readonly missing_media_ids: readonly number[];
  readonly hidden_adult_count: number;
}

export function PartitionBookmarks(
  bookmarked_media_ids: ReadonlySet<number>,
  bookmark_catalog_entries: ReadonlyMap<number, BookmarkCatalogEntry>,
  is_adult_content_visible: boolean
): BookmarkPartition {
  const main_entries: BookmarkCatalogEntry[] = [];
  const completed_entries: BookmarkCatalogEntry[] = [];
  const missing_media_ids: number[] = [];
  let hidden_adult_count = 0;

  for (const media_id of bookmarked_media_ids) {
    const catalog_entry = bookmark_catalog_entries.get(media_id);

    if (catalog_entry === undefined) {
      missing_media_ids.push(media_id);
      continue;
    }

    if (catalog_entry.is_adult && !is_adult_content_visible) {
      hidden_adult_count += 1;
      continue;
    }

    if (catalog_entry.media_status === 'FINISHED') {
      completed_entries.push(catalog_entry);
    } else {
      main_entries.push(catalog_entry);
    }
  }

  completed_entries.sort(
    (left_entry, right_entry) =>
      left_entry.title.primary.localeCompare(right_entry.title.primary, 'th') ||
      left_entry.anilist_media_id - right_entry.anilist_media_id
  );

  return Object.freeze({
    main_entries: Object.freeze(main_entries),
    completed_entries: Object.freeze(completed_entries),
    missing_media_ids: Object.freeze(missing_media_ids),
    hidden_adult_count
  });
}

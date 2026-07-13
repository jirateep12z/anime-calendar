import { toast } from 'sonner';

import type { BookmarkCatalogEntry } from '../types/notification';

const BOOKMARK_UNDO_DURATION_MILLISECONDS = 5_000;

type ToggleBookmarkCallback = (
  anilist_media_id: number,
  catalog_entry?: BookmarkCatalogEntry
) => Promise<void>;

export function RemoveBookmarkWithUndo(
  catalog_entry: BookmarkCatalogEntry,
  ToggleBookmark: ToggleBookmarkCallback
): void {
  void ToggleBookmark(catalog_entry.anilist_media_id, catalog_entry);
  toast('นำออกจากบุ๊กมาร์กแล้ว', {
    description: catalog_entry.title.primary,
    duration: BOOKMARK_UNDO_DURATION_MILLISECONDS,
    action: {
      label: 'เลิกทำ',
      onClick: () =>
        void ToggleBookmark(catalog_entry.anilist_media_id, catalog_entry)
    }
  });
}

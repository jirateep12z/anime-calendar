'use client';

import { BookmarkCheckIcon, BookmarkIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { UseNotifications } from '../hooks/use-notifications';

import type { BookmarkCatalogEntry } from '../types/notification';

interface BookmarkButtonProps {
  readonly anilist_media_id: number;
  readonly title: string;
  readonly catalog_entry?: BookmarkCatalogEntry;
}

export function BookmarkButton({
  anilist_media_id,
  title,
  catalog_entry
}: BookmarkButtonProps) {
  const { bookmarked_media_ids, pending_media_ids, ToggleBookmark } =
    UseNotifications();
  const is_bookmarked = bookmarked_media_ids.has(anilist_media_id);
  const is_pending = pending_media_ids.has(anilist_media_id);
  const accessible_label = is_bookmarked
    ? `นำ ${title} ออกจากบุ๊กมาร์ก`
    : `เพิ่ม ${title} ไปยังบุ๊กมาร์ก`;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-pressed={is_bookmarked}
      aria-label={accessible_label}
      aria-busy={is_pending}
      disabled={is_pending}
      onClick={() =>
        void (catalog_entry === undefined
          ? ToggleBookmark(anilist_media_id)
          : ToggleBookmark(anilist_media_id, catalog_entry))
      }
    >
      {is_pending ? (
        <Spinner aria-hidden="true" />
      ) : is_bookmarked ? (
        <BookmarkCheckIcon aria-hidden="true" />
      ) : (
        <BookmarkIcon aria-hidden="true" />
      )}
    </Button>
  );
}

import { Trash2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ScheduleCover } from '@/features/anime-calendar/components/schedule-cover';

import type { ScheduleEntry } from '@/features/anime-calendar/types/schedule';
import type { BookmarkCatalogEntry } from '../types/notification';

interface BookmarkListItemProps {
  readonly catalog_entry: BookmarkCatalogEntry;
  readonly is_pending: boolean;
  readonly schedule_entry?: ScheduleEntry;
  readonly HandleOpen: (catalog_entry: BookmarkCatalogEntry) => void;
  readonly HandleRemove: (catalog_entry: BookmarkCatalogEntry) => void;
}

export function BookmarkListItem({
  catalog_entry,
  is_pending,
  schedule_entry,
  HandleOpen,
  HandleRemove
}: BookmarkListItemProps) {
  return (
    <li className="flex min-w-0 items-center gap-3 rounded-lg border p-2">
      <button
        type="button"
        className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:ring-3 focus-visible:outline-none"
        onClick={() => HandleOpen(catalog_entry)}
      >
        <ScheduleCover
          cover_image_url={catalog_entry.cover_image_url}
          title={catalog_entry.title.primary}
          className="h-16 w-11 shrink-0 rounded-sm"
          sizes="44px"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="line-clamp-2 text-sm font-medium">
            {catalog_entry.title.primary}
          </span>
          <span className="flex flex-wrap items-center gap-1">
            {catalog_entry.media_status === 'FINISHED' ? (
              <Badge variant="secondary">จบแล้ว</Badge>
            ) : (
              <Badge variant="outline">กำลังฉาย</Badge>
            )}
            {catalog_entry.total_episodes !== null ? (
              <span className="text-muted-foreground text-xs">
                {catalog_entry.total_episodes.toLocaleString('th-TH')} ตอน
              </span>
            ) : null}
            {schedule_entry ? (
              <span className="text-muted-foreground text-xs">
                {schedule_entry.airing_time} น. · ตอน{' '}
                {schedule_entry.episode_number.toLocaleString('th-TH')}
              </span>
            ) : null}
            {is_pending ? (
              <span className="text-muted-foreground text-xs" role="status">
                รอซิงก์
              </span>
            ) : null}
          </span>
        </span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        disabled={is_pending}
        aria-busy={is_pending}
        aria-label={`นำ ${catalog_entry.title.primary} ออกจากบุ๊กมาร์ก`}
        onClick={() => HandleRemove(catalog_entry)}
      >
        {is_pending ? (
          <Spinner aria-hidden="true" />
        ) : (
          <Trash2Icon aria-hidden="true" />
        )}
      </Button>
    </li>
  );
}

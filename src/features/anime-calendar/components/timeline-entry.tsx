import { RadioIcon } from 'lucide-react';
import { memo } from 'react';

import { Badge } from '@/components/ui/badge';
import { BookmarkButton } from '@/features/anime-notifications/components/bookmark-button';
import { CreateBookmarkCatalogEntryFromSchedule } from '@/features/anime-notifications/services/create-bookmark-catalog-entry';
import { AIRING_BADGE_CLASS_NAME } from '../constants/schedule';
import { UseCalendarTime } from '../hooks/use-current-time';
import { FormatScheduleCountdown } from '../utils/countdown';
import { CalculateBroadcastStatus } from '../utils/schedule-time';

import type { ScheduleEntry } from '../types/schedule';

interface TimelineEntryProps {
  readonly schedule_entry: ScheduleEntry;
  readonly HandleOpen: (schedule_entry: ScheduleEntry) => void;
}

function TimelineEntryStatus({
  schedule_entry
}: Pick<TimelineEntryProps, 'schedule_entry'>) {
  const now_seconds = UseCalendarTime();
  const broadcast_status = CalculateBroadcastStatus(
    schedule_entry,
    now_seconds
  );
  const is_airing = broadcast_status === 'AIRING';
  const stable_status_label =
    broadcast_status === 'UPCOMING'
      ? 'กำลังจะออกอากาศ'
      : is_airing
        ? 'กำลังออกอากาศ'
        : 'ออกอากาศแล้ว';

  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
      {is_airing ? (
        <Badge variant="airing" className={AIRING_BADGE_CLASS_NAME}>
          <RadioIcon data-icon="inline-start" aria-hidden="true" />
          ขณะนี้
        </Badge>
      ) : null}
      <span aria-hidden="true">
        {FormatScheduleCountdown(schedule_entry, now_seconds)}
      </span>
      <span className="sr-only">{stable_status_label}</span>
    </span>
  );
}

export const TimelineEntry = memo(function TimelineEntry({
  schedule_entry,
  HandleOpen
}: TimelineEntryProps) {
  return (
    <li className="grid grid-cols-[4.5rem_1.25rem_minmax(0,1fr)_auto] gap-3">
      <time className="pt-3 text-right font-sans text-sm font-semibold tabular-nums">
        {schedule_entry.airing_time}
      </time>
      <div className="relative flex justify-center" aria-hidden="true">
        <span className="bg-schedule-rail absolute inset-y-0 w-px" />
        <span className="bg-background border-schedule-rail relative mt-4 size-3 rounded-full border-2" />
      </div>
      <button
        type="button"
        className="hover:bg-muted focus-visible:ring-ring mb-3 flex min-w-0 flex-col items-start gap-2 rounded-lg border p-3 text-left focus-visible:ring-3 focus-visible:outline-none"
        onClick={() => HandleOpen(schedule_entry)}
      >
        <span className="sr-only">เปิดรายละเอียด</span>
        <span className="flex w-full flex-wrap items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-medium">
            {schedule_entry.title.primary}
          </span>
          <Badge variant="outline">ตอน {schedule_entry.episode_number}</Badge>
        </span>
        <TimelineEntryStatus schedule_entry={schedule_entry} />
      </button>
      <div className="mb-3 flex items-start">
        <BookmarkButton
          anilist_media_id={schedule_entry.anilist_media_id}
          title={schedule_entry.title.primary}
          catalog_entry={CreateBookmarkCatalogEntryFromSchedule(schedule_entry)}
        />
      </div>
    </li>
  );
});

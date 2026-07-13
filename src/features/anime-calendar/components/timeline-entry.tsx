import { RadioIcon } from 'lucide-react';
import { memo } from 'react';

import { Badge } from '@/components/ui/badge';
import { BookmarkButton } from '@/features/anime-bookmarks/client';
import {
  CalculateBroadcastStatus,
  CreateAnimeCatalogEntryFromSchedule,
  FormatScheduleCountdown
} from '@/features/anime-schedule';
import { AnimeStatusBadge } from '@/features/anime-schedule/client';
import { Cn } from '@/lib/utils';
import { UseCalendarTime } from '../hooks/use-current-time';

import type { ScheduleEntry } from '@/features/anime-schedule';

interface TimelineEntryProps {
  readonly schedule_entry: ScheduleEntry;
  readonly HandleOpen: (schedule_entry: ScheduleEntry) => void;
}

function TimelineEntryRailDot({
  schedule_entry
}: Pick<TimelineEntryProps, 'schedule_entry'>) {
  const now_seconds = UseCalendarTime();
  const broadcast_status = CalculateBroadcastStatus(
    schedule_entry,
    now_seconds
  );
  const dot_class_name =
    broadcast_status === 'AIRING'
      ? 'on-air-dot border-(color:--brand-on-air)'
      : broadcast_status === 'AIRED'
        ? 'bg-schedule-rail border-schedule-rail'
        : 'bg-background border-schedule-rail';

  return (
    <span
      className={Cn(
        'relative mt-4 size-3 rounded-full border-2',
        dot_class_name
      )}
    />
  );
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
        <AnimeStatusBadge status="AIRING">
          <RadioIcon data-icon="inline-start" aria-hidden="true" />
          ขณะนี้
        </AnimeStatusBadge>
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
    <li className="grid grid-cols-[3rem_1.25rem_minmax(0,1fr)_auto] gap-2 sm:grid-cols-[4.5rem_1.25rem_minmax(0,1fr)_auto] sm:gap-3">
      <time className="pt-3 text-right text-sm font-semibold tabular-nums">
        {schedule_entry.airing_time}
      </time>
      <div className="relative flex justify-center" aria-hidden="true">
        <span className="bg-schedule-rail absolute inset-y-0 w-px" />
        <TimelineEntryRailDot schedule_entry={schedule_entry} />
      </div>
      <button
        type="button"
        className="bg-card hover:bg-accent focus-visible:ring-ring mb-3 flex min-w-0 flex-col items-start gap-2 rounded-xl border p-3 text-left focus-visible:ring-3 focus-visible:outline-none"
        onClick={() => HandleOpen(schedule_entry)}
      >
        <span className="sr-only">เปิดรายละเอียด</span>
        <span className="line-clamp-2 w-full font-medium break-words">
          {schedule_entry.title.primary}
        </span>
        <span className="flex w-full flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-sm">
            ตอน {schedule_entry.episode_number}
          </Badge>
          <TimelineEntryStatus schedule_entry={schedule_entry} />
        </span>
      </button>
      <div className="mb-3 flex items-start">
        <BookmarkButton
          anilist_media_id={schedule_entry.anilist_media_id}
          title={schedule_entry.title.primary}
          catalog_entry={CreateAnimeCatalogEntryFromSchedule(schedule_entry)}
        />
      </div>
    </li>
  );
});

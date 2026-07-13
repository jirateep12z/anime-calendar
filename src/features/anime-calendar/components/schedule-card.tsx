'use client';

import { StarIcon } from 'lucide-react';
import { memo } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { BookmarkButton } from '@/features/anime-bookmarks/client';
import {
  CalculateBroadcastStatus,
  CreateAnimeCatalogEntryFromSchedule,
  FormatScheduleCountdownDuration
} from '@/features/anime-schedule';
import {
  AnimeStatusBadge,
  ScheduleCover
} from '@/features/anime-schedule/client';
import { UseCalendarTime } from '../hooks/use-current-time';

import type { BroadcastStatus, ScheduleEntry } from '@/features/anime-schedule';
import type { ReactNode } from 'react';

interface ScheduleCardProps {
  readonly schedule_entry: ScheduleEntry;
  readonly HandleOpen: (schedule_entry: ScheduleEntry) => void;
}

const STATUS_LABEL_BY_STATUS: Readonly<Record<BroadcastStatus, string>> = {
  UPCOMING: 'กำลังจะออกอากาศ',
  AIRING: 'กำลังออกอากาศ',
  AIRED: 'ออกอากาศแล้ว'
};

function ScheduleCardFrame({
  schedule_entry,
  children
}: Pick<ScheduleCardProps, 'schedule_entry'> & {
  readonly children: ReactNode;
}) {
  const now_seconds = UseCalendarTime();
  const broadcast_status = CalculateBroadcastStatus(
    schedule_entry,
    now_seconds
  );

  return (
    <Card
      data-broadcast-status={broadcast_status}
      className="focus-within:ring-ring relative h-full p-0 transition-transform focus-within:ring-3 focus-within:outline-none hover:-translate-y-0.5 motion-reduce:transform-none"
    >
      {children}
    </Card>
  );
}

function ScheduleCardCountdown({
  schedule_entry
}: Pick<ScheduleCardProps, 'schedule_entry'>) {
  const now_seconds = UseCalendarTime();
  const broadcast_status = CalculateBroadcastStatus(
    schedule_entry,
    now_seconds
  );
  const countdown_label =
    broadcast_status === 'UPCOMING'
      ? 'เริ่มในอีก'
      : broadcast_status === 'AIRING'
        ? 'จบในอีก'
        : 'ออกอากาศแล้ว';

  return (
    <div className="text-muted-foreground min-h-[4.5rem] min-w-0 text-sm">
      <span className="whitespace-nowrap">{countdown_label}</span>
      {broadcast_status !== 'AIRED' ? (
        <span className="text-foreground mt-1 block text-base leading-6 font-semibold tabular-nums">
          {FormatScheduleCountdownDuration(schedule_entry, now_seconds)}
        </span>
      ) : null}
    </div>
  );
}

function ScheduleCardBadges({
  schedule_entry
}: Pick<ScheduleCardProps, 'schedule_entry'>) {
  const now_seconds = UseCalendarTime();
  const broadcast_status = CalculateBroadcastStatus(
    schedule_entry,
    now_seconds
  );

  return (
    <CardFooter className="mt-auto flex flex-wrap gap-1.5 p-0">
      <AnimeStatusBadge status={broadcast_status}>
        {STATUS_LABEL_BY_STATUS[broadcast_status]}
      </AnimeStatusBadge>
      <Badge variant="outline" className="rounded-sm">
        {schedule_entry.format}
      </Badge>
      {schedule_entry.average_score !== null ? (
        <Badge variant="secondary" className="rounded-sm">
          <StarIcon data-icon="inline-start" aria-hidden="true" />
          {schedule_entry.average_score}%
        </Badge>
      ) : null}
      {schedule_entry.is_adult ? (
        <AnimeStatusBadge status="ADULT">18+</AnimeStatusBadge>
      ) : null}
    </CardFooter>
  );
}

export const ScheduleCard = memo(function ScheduleCard({
  schedule_entry,
  HandleOpen
}: ScheduleCardProps) {
  return (
    <ScheduleCardFrame schedule_entry={schedule_entry}>
      <button
        type="button"
        className="grid h-full w-full grid-cols-[7rem_minmax(0,1fr)] items-stretch text-left focus-visible:outline-none sm:grid-cols-[8rem_minmax(0,1fr)]"
        onClick={() => HandleOpen(schedule_entry)}
      >
        <span className="sr-only">
          เปิดรายละเอียด {schedule_entry.title.primary}
        </span>
        <ScheduleCover
          cover_image_url={schedule_entry.cover_image_url}
          title={schedule_entry.title.primary}
          className="!aspect-auto h-full min-h-44 w-full shrink-0 group-data-[broadcast-status=AIRED]/card:opacity-60 sm:w-full"
          sizes="(max-width: 639px) 112px, 128px"
        />
        <div className="flex min-h-44 min-w-0 flex-col gap-3 p-4">
          <CardContent className="flex min-w-0 items-baseline justify-between gap-3 p-0">
            <span>
              <span className="text-2xl font-bold tabular-nums">
                {schedule_entry.airing_time}
              </span>
              <span className="text-muted-foreground text-xs"> น.</span>
            </span>
            <span className="text-muted-foreground text-xs">
              <span className="tabular-nums" aria-hidden="true">
                EP {schedule_entry.episode_number}
              </span>
              <span className="sr-only">
                ตอน {schedule_entry.episode_number}
              </span>
            </span>
          </CardContent>
          <CardHeader className="min-w-0 p-0">
            <CardTitle className="line-clamp-2 leading-snug">
              {schedule_entry.title.primary}
            </CardTitle>
            {schedule_entry.title.romaji !== null &&
            schedule_entry.title.romaji !== schedule_entry.title.primary ? (
              <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                {schedule_entry.title.romaji}
              </CardDescription>
            ) : null}
          </CardHeader>
          <ScheduleCardCountdown schedule_entry={schedule_entry} />
          <ScheduleCardBadges schedule_entry={schedule_entry} />
        </div>
      </button>
      <div className="bg-background/90 absolute top-2 left-2 rounded-md">
        <BookmarkButton
          anilist_media_id={schedule_entry.anilist_media_id}
          title={schedule_entry.title.primary}
          catalog_entry={CreateAnimeCatalogEntryFromSchedule(schedule_entry)}
        />
      </div>
    </ScheduleCardFrame>
  );
});

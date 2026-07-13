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
import { BookmarkButton } from '@/features/anime-notifications/components/bookmark-button';
import { CreateBookmarkCatalogEntryFromSchedule } from '@/features/anime-notifications/services/create-bookmark-catalog-entry';
import { AIRING_BADGE_CLASS_NAME } from '../constants/schedule';
import { UseCalendarTime } from '../hooks/use-current-time';
import { NormalizeAnimeDescription } from '../utils/anime-description';
import { FormatScheduleCountdownDuration } from '../utils/countdown';
import { CalculateBroadcastStatus } from '../utils/schedule-time';
import { ScheduleCover } from './schedule-cover';

import type { BroadcastStatus, ScheduleEntry } from '../types/schedule';

interface ScheduleCardProps {
  readonly schedule_entry: ScheduleEntry;
  readonly HandleOpen: (schedule_entry: ScheduleEntry) => void;
}

const STATUS_LABEL_BY_STATUS: Readonly<Record<BroadcastStatus, string>> = {
  UPCOMING: 'กำลังจะออกอากาศ',
  AIRING: 'กำลังออกอากาศ',
  AIRED: 'ออกอากาศแล้ว'
};
const STATUS_VARIANT_BY_STATUS = {
  UPCOMING: 'upcoming',
  AIRING: 'airing',
  AIRED: 'aired'
} as const;

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
      ? 'ออกอากาศใน'
      : broadcast_status === 'AIRING'
        ? 'กำลังออกอากาศ เหลือ'
        : 'ออกอากาศแล้ว';

  return (
    <div className="text-muted-foreground min-h-[4.5rem] min-w-0 font-sans text-sm">
      <span className="whitespace-nowrap">{countdown_label}</span>
      {broadcast_status !== 'AIRED' ? (
        <span className="text-foreground mt-1 block font-sans text-base leading-6 font-semibold">
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
      <Badge
        variant={STATUS_VARIANT_BY_STATUS[broadcast_status]}
        className={
          broadcast_status === 'AIRING' ? AIRING_BADGE_CLASS_NAME : undefined
        }
      >
        {STATUS_LABEL_BY_STATUS[broadcast_status]}
      </Badge>
      <Badge variant="outline">{schedule_entry.format}</Badge>
      {schedule_entry.average_score !== null ? (
        <Badge variant="secondary">
          <StarIcon data-icon="inline-start" aria-hidden="true" />
          {schedule_entry.average_score}%
        </Badge>
      ) : null}
      {schedule_entry.is_adult ? <Badge variant="adult">18+</Badge> : null}
    </CardFooter>
  );
}

export const ScheduleCard = memo(function ScheduleCard({
  schedule_entry,
  HandleOpen
}: ScheduleCardProps) {
  const normalized_description = NormalizeAnimeDescription(
    schedule_entry.description
  );

  return (
    <Card className="relative h-full p-0 transition-transform focus-within:ring-3 focus-within:outline-none hover:-translate-y-0.5 motion-reduce:transform-none">
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
          className="!aspect-auto h-full min-h-52 w-full shrink-0 sm:w-full"
          sizes="(max-width: 639px) 112px, 128px"
        />
        <div className="flex min-h-52 min-w-0 flex-col gap-3 p-4">
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
          {normalized_description ? (
            <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
              {normalized_description}
            </p>
          ) : null}
          <CardContent className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 p-0">
            <span className="font-sans text-xl font-bold tabular-nums">
              {schedule_entry.airing_time}
              <span className="text-xs font-normal"> น.</span>
            </span>
            <span className="text-muted-foreground text-sm">
              ตอน {schedule_entry.episode_number}
            </span>
          </CardContent>
          <ScheduleCardCountdown schedule_entry={schedule_entry} />
          <ScheduleCardBadges schedule_entry={schedule_entry} />
        </div>
      </button>
      <div className="bg-background/90 absolute top-2 left-2 rounded-md">
        <BookmarkButton
          anilist_media_id={schedule_entry.anilist_media_id}
          title={schedule_entry.title.primary}
          catalog_entry={CreateBookmarkCatalogEntryFromSchedule(schedule_entry)}
        />
      </div>
    </Card>
  );
});

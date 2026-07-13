import { Fragment } from 'react';

import {
  FormatBangkokDate,
  FormatBangkokTime,
  FormatScheduleDayLabel
} from '@/features/anime-schedule';
import { UseCalendarTime } from '../hooks/use-current-time';
import { TimelineEntry } from './timeline-entry';

import type { ScheduleEntry } from '@/features/anime-schedule';

interface TimelineDayGroupProps {
  readonly schedule_date: string;
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly HandleOpenEntry: (schedule_entry: ScheduleEntry) => void;
}

interface TimelineEntryListProps {
  readonly schedule_date: string;
  readonly sorted_entries: readonly ScheduleEntry[];
  readonly HandleOpenEntry: (schedule_entry: ScheduleEntry) => void;
}

function TimelineNowMarker({ now_seconds }: { readonly now_seconds: number }) {
  return (
    <li
      className="grid grid-cols-[3rem_1.25rem_minmax(0,1fr)_auto] items-center gap-2 pb-3 sm:grid-cols-[4.5rem_1.25rem_minmax(0,1fr)_auto] sm:gap-3"
      aria-hidden="true"
    >
      <span className="text-right text-xs font-bold text-(color:--brand-on-air) tabular-nums">
        {FormatBangkokTime(now_seconds)}
      </span>
      <span className="relative flex h-full justify-center">
        <span className="bg-schedule-rail absolute inset-y-0 w-px" />
        <span className="on-air-dot relative size-2.5" />
      </span>
      <span className="h-px bg-(color:--brand-on-air)" />
      <span />
    </li>
  );
}

function TimelineEntryList({
  schedule_date,
  sorted_entries,
  HandleOpenEntry
}: TimelineEntryListProps) {
  const now_seconds = UseCalendarTime();
  const is_today = FormatBangkokDate(now_seconds) === schedule_date;
  const next_entry_index = sorted_entries.findIndex(
    schedule_entry => schedule_entry.airing_at > now_seconds
  );
  const now_marker_index =
    next_entry_index === -1 ? sorted_entries.length : next_entry_index;

  return (
    <ol className="py-3">
      {sorted_entries.map((schedule_entry, entry_index) => (
        <Fragment key={schedule_entry.public_id}>
          {is_today && entry_index === now_marker_index ? (
            <TimelineNowMarker now_seconds={now_seconds} />
          ) : null}
          <TimelineEntry
            schedule_entry={schedule_entry}
            HandleOpen={HandleOpenEntry}
          />
        </Fragment>
      ))}
      {is_today && now_marker_index === sorted_entries.length ? (
        <TimelineNowMarker now_seconds={now_seconds} />
      ) : null}
    </ol>
  );
}

export function TimelineDayGroup({
  schedule_date,
  schedule_entries,
  HandleOpenEntry
}: TimelineDayGroupProps) {
  const sorted_entries = [...schedule_entries].sort(
    (left_entry, right_entry) => left_entry.airing_at - right_entry.airing_at
  );

  return (
    <section aria-labelledby={`timeline-day-${schedule_date}`}>
      <h2
        id={`timeline-day-${schedule_date}`}
        className="bg-background/95 sticky top-16 z-[5] border-b py-3 text-lg font-semibold backdrop-blur"
      >
        {FormatScheduleDayLabel(schedule_date)}
      </h2>
      {sorted_entries.length > 0 ? (
        <TimelineEntryList
          schedule_date={schedule_date}
          sorted_entries={sorted_entries}
          HandleOpenEntry={HandleOpenEntry}
        />
      ) : (
        <p className="text-muted-foreground py-6 text-sm">
          ไม่มีรายการออกอากาศในวันนี้
        </p>
      )}
    </section>
  );
}

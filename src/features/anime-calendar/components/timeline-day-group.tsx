import { FormatScheduleDayLabel } from '../utils/schedule-date-label';
import { TimelineEntry } from './timeline-entry';

import type { ScheduleEntry } from '../types/schedule';

interface TimelineDayGroupProps {
  readonly schedule_date: string;
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly HandleOpenEntry: (schedule_entry: ScheduleEntry) => void;
}

export function TimelineDayGroup({
  schedule_date,
  schedule_entries,
  HandleOpenEntry
}: TimelineDayGroupProps) {
  return (
    <section aria-labelledby={`timeline-day-${schedule_date}`}>
      <h2
        id={`timeline-day-${schedule_date}`}
        className="bg-background/95 sticky top-14 z-[5] border-b py-3 text-lg font-semibold backdrop-blur sm:top-16"
      >
        {FormatScheduleDayLabel(schedule_date)}
      </h2>
      {schedule_entries.length > 0 ? (
        <ol className="py-3">
          {[...schedule_entries]
            .sort(
              (left_entry, right_entry) =>
                left_entry.airing_at - right_entry.airing_at
            )
            .map(schedule_entry => (
              <TimelineEntry
                key={schedule_entry.public_id}
                schedule_entry={schedule_entry}
                HandleOpen={HandleOpenEntry}
              />
            ))}
        </ol>
      ) : (
        <p className="text-muted-foreground py-6 text-sm">
          ไม่มีรายการออกอากาศในวันนี้
        </p>
      )}
    </section>
  );
}

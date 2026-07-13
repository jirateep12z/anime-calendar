import { TimelineDayGroup } from './timeline-day-group';

import type { ScheduleEntry } from '../types/schedule';

interface TimelineScheduleViewProps {
  readonly schedule_dates: readonly string[];
  readonly grouped_entries: ReadonlyMap<string, readonly ScheduleEntry[]>;
  readonly HandleOpenEntry: (schedule_entry: ScheduleEntry) => void;
}

export function TimelineScheduleView({
  schedule_dates,
  grouped_entries,
  HandleOpenEntry
}: TimelineScheduleViewProps) {
  return (
    <div className="flex flex-col gap-2">
      {schedule_dates.map(schedule_date => (
        <TimelineDayGroup
          key={schedule_date}
          schedule_date={schedule_date}
          schedule_entries={grouped_entries.get(schedule_date) ?? []}
          HandleOpenEntry={HandleOpenEntry}
        />
      ))}
    </div>
  );
}

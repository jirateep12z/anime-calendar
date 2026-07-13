import { ScheduleDaySection } from './schedule-day-section';
import { ScheduleDayTabs } from './schedule-day-tabs';

import type { ScheduleEntry } from '@/features/anime-schedule';

interface WeeklyScheduleViewProps {
  readonly schedule_dates: readonly string[];
  readonly grouped_entries: ReadonlyMap<string, readonly ScheduleEntry[]>;
  readonly selected_date: string;
  readonly HandleSelectDate: (selected_date: string) => void;
  readonly HandleOpenEntry: (schedule_entry: ScheduleEntry) => void;
}

export function WeeklyScheduleView({
  schedule_dates,
  grouped_entries,
  selected_date,
  HandleSelectDate,
  HandleOpenEntry
}: WeeklyScheduleViewProps) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ScheduleDayTabs
        schedule_dates={schedule_dates}
        selected_date={selected_date}
        HandleSelectDate={HandleSelectDate}
      />
      {schedule_dates.map(schedule_date => (
        <ScheduleDaySection
          key={schedule_date}
          schedule_date={schedule_date}
          schedule_entries={grouped_entries.get(schedule_date) ?? []}
          is_selected={schedule_date === selected_date}
          HandleOpenEntry={HandleOpenEntry}
        />
      ))}
    </div>
  );
}

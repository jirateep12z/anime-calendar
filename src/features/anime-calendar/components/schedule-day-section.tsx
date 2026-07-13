import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/components/ui/empty';
import { FormatScheduleDayLabel } from '../utils/schedule-date-label';
import { ScheduleCard } from './schedule-card';

import type { ScheduleEntry } from '../types/schedule';

interface ScheduleDaySectionProps {
  readonly schedule_date: string;
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly is_selected: boolean;
  readonly HandleOpenEntry: (schedule_entry: ScheduleEntry) => void;
}

export function ScheduleDaySection({
  schedule_date,
  schedule_entries,
  is_selected,
  HandleOpenEntry
}: ScheduleDaySectionProps) {
  const visibility_class_name = is_selected ? 'flex' : 'hidden sm:flex';

  return (
    <section
      id={`schedule-panel-${schedule_date}`}
      data-testid="schedule-day-section"
      aria-labelledby={`schedule-day-${schedule_date}`}
      className={`${visibility_class_name} flex-col gap-4`}
    >
      <h2
        id={`schedule-day-${schedule_date}`}
        className="border-b pb-2 text-lg font-semibold"
      >
        {FormatScheduleDayLabel(schedule_date)}
      </h2>
      {schedule_entries.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...schedule_entries]
            .sort(
              (left_entry, right_entry) =>
                left_entry.airing_at - right_entry.airing_at
            )
            .map(schedule_entry => (
              <ScheduleCard
                key={schedule_entry.public_id}
                schedule_entry={schedule_entry}
                HandleOpen={HandleOpenEntry}
              />
            ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>วันนี้ยังไม่มีรายการออกอากาศ</EmptyTitle>
            <EmptyDescription>
              เลือกวันอื่นเพื่อดูตารางที่กำลังจะมาถึง
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { FormatScheduleTabLabel } from '../utils/schedule-date-label';

import type { KeyboardEvent } from 'react';

interface MobileDayTabsProps {
  readonly schedule_dates: readonly string[];
  readonly selected_date: string;
  readonly HandleSelectDate: (selected_date: string) => void;
}

export function MobileDayTabs({
  schedule_dates,
  selected_date,
  HandleSelectDate
}: MobileDayTabsProps) {
  const HandleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    current_index: number
  ) => {
    const last_index = schedule_dates.length - 1;
    let next_index: number | null = null;

    if (event.key === 'ArrowRight') {
      next_index = current_index === last_index ? 0 : current_index + 1;
    } else if (event.key === 'ArrowLeft') {
      next_index = current_index === 0 ? last_index : current_index - 1;
    } else if (event.key === 'Home') {
      next_index = 0;
    } else if (event.key === 'End') {
      next_index = last_index;
    }

    if (next_index === null) return;

    event.preventDefault();
    HandleSelectDate(schedule_dates[next_index]);
    const tab_elements =
      event.currentTarget.parentElement?.querySelectorAll('[role="tab"]');

    (tab_elements?.[next_index] as HTMLButtonElement | undefined)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="เลือกวันออกอากาศ"
      className="flex w-full min-w-0 items-center gap-1 overflow-x-auto rounded-lg border p-1 sm:hidden"
    >
      {schedule_dates.map((schedule_date, date_index) => {
        const tab_label = FormatScheduleTabLabel(schedule_date);
        const is_selected = schedule_date === selected_date;

        return (
          <Button
            key={schedule_date}
            type="button"
            role="tab"
            variant={is_selected ? 'secondary' : 'ghost'}
            aria-selected={is_selected}
            aria-controls={`schedule-panel-${schedule_date}`}
            id={`schedule-tab-${schedule_date}`}
            tabIndex={is_selected ? 0 : -1}
            className="h-auto min-w-12 shrink-0 flex-col gap-0.5 px-2 py-1"
            onClick={() => HandleSelectDate(schedule_date)}
            onKeyDown={event => HandleTabKeyDown(event, date_index)}
          >
            <span>{tab_label.weekday_label}</span>
            <span className="text-xs">{tab_label.date_label}</span>
          </Button>
        );
      })}
    </div>
  );
}

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Cn } from '@/lib/utils';

import type { ScheduleViewMode } from '../types/calendar';

interface ScheduleLoadingStateProps {
  readonly view_mode: ScheduleViewMode;
}

const WEEKLY_TAB_COUNT = 7;
const WEEKLY_CARD_COUNT = 6;
const TIMELINE_DAY_COUNT = 2;
const TIMELINE_ENTRY_COUNT = 4;

function LoadingBlock({ className }: { readonly className: string }) {
  return <Skeleton className={Cn('motion-reduce:animate-none', className)} />;
}

function ScheduleCardSkeleton() {
  return (
    <Card className="relative h-full p-0">
      <div className="grid h-full grid-cols-[7rem_minmax(0,1fr)] items-stretch sm:grid-cols-[8rem_minmax(0,1fr)]">
        <LoadingBlock className="h-full min-h-44 rounded-none" />
        <div className="flex min-h-44 min-w-0 flex-col gap-3 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <LoadingBlock className="h-8 w-20" />
            <LoadingBlock className="h-3 w-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <LoadingBlock className="h-5 w-3/4" />
            <LoadingBlock className="h-3 w-1/2" />
          </div>
          <div className="flex min-h-[4.5rem] flex-col gap-2">
            <LoadingBlock className="h-4 w-16" />
            <LoadingBlock className="h-6 w-28" />
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5">
            <LoadingBlock className="h-5 w-24 rounded-sm" />
            <LoadingBlock className="h-5 w-12 rounded-sm" />
            <LoadingBlock className="h-5 w-12 rounded-sm" />
          </div>
        </div>
      </div>
      <LoadingBlock className="absolute top-2 left-2 size-10" />
    </Card>
  );
}

function WeeklyLoadingState() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="bg-card flex w-full min-w-0 items-center gap-1 overflow-x-auto rounded-lg border p-1 sm:overflow-visible">
        {Array.from({ length: WEEKLY_TAB_COUNT }, (_, tab_index) => (
          <LoadingBlock
            key={tab_index}
            className="h-12 min-w-12 shrink-0 sm:min-w-0 sm:flex-1"
          />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <div className="border-b pb-2">
          <LoadingBlock className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: WEEKLY_CARD_COUNT }, (_, card_index) => (
            <ScheduleCardSkeleton key={card_index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineEntrySkeleton() {
  return (
    <li className="grid grid-cols-[3rem_1.25rem_minmax(0,1fr)_auto] gap-2 sm:grid-cols-[4.5rem_1.25rem_minmax(0,1fr)_auto] sm:gap-3">
      <div className="flex justify-end pt-3">
        <LoadingBlock className="h-5 w-10" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-schedule-rail absolute inset-y-0 w-px" />
        <span className="bg-background border-schedule-rail relative mt-4 size-3 rounded-full border-2" />
      </div>
      <div className="bg-card mb-3 flex min-w-0 flex-col gap-2 rounded-xl border p-3">
        <LoadingBlock className="h-5 w-3/4" />
        <div className="flex flex-wrap items-center gap-2">
          <LoadingBlock className="h-5 w-14 rounded-sm" />
          <LoadingBlock className="h-4 w-24" />
        </div>
      </div>
      <div className="mb-3 flex items-start">
        <LoadingBlock className="size-10" />
      </div>
    </li>
  );
}

function TimelineLoadingState() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: TIMELINE_DAY_COUNT }, (_, day_index) => (
        <div key={day_index}>
          <div className="border-b py-3">
            <LoadingBlock className="h-7 w-48" />
          </div>
          <ol className="py-3">
            {Array.from({ length: TIMELINE_ENTRY_COUNT }, (_, entry_index) => (
              <TimelineEntrySkeleton key={entry_index} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export function ScheduleLoadingState({ view_mode }: ScheduleLoadingStateProps) {
  return (
    <div>
      <p role="status" className="sr-only">
        กำลังโหลดตาราง
      </p>
      <div aria-hidden="true">
        {view_mode === 'TIMELINE' ? (
          <TimelineLoadingState />
        ) : (
          <WeeklyLoadingState />
        )}
      </div>
    </div>
  );
}

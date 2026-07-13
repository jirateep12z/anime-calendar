import { CalendarProviders } from '@/features/anime-calendar/providers/calendar-providers';
import { Suspense } from 'react';

import type { ReactNode } from 'react';

export default function CalendarLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          className="bg-background min-h-screen"
          aria-busy="true"
          aria-label="กำลังเตรียมตารางอนิเมะ"
        />
      }
    >
      <CalendarProviders>{children}</CalendarProviders>
    </Suspense>
  );
}

import { CalendarProviders } from '@/features/anime-calendar/client';
import { AppBottomNav } from '@/features/app-shell/client';
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
      <CalendarProviders>
        <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
          {children}
        </div>
        <AppBottomNav />
      </CalendarProviders>
    </Suspense>
  );
}

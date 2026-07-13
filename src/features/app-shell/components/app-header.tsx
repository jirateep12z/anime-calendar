'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { FormatBangkokTime } from '@/features/anime-schedule';
import { AppLoadingLinkStatus } from '@/features/app-loading';
import { ThemeSwitcher } from '@/features/theme';

import type { ReactNode } from 'react';

const CLOCK_TICK_INTERVAL_MILLISECONDS = 1000;

interface AppHeaderProps {
  readonly actions?: ReactNode;
}

function HeaderClock() {
  const [now_seconds, set_now_seconds] = useState<number | null>(null);

  useEffect(() => {
    const UpdateNowSeconds = () => {
      set_now_seconds(Math.floor(Date.now() / 1000));
    };
    const timeout_id = window.setTimeout(UpdateNowSeconds, 0);
    const interval_id = window.setInterval(
      UpdateNowSeconds,
      CLOCK_TICK_INTERVAL_MILLISECONDS
    );

    return () => {
      window.clearTimeout(timeout_id);
      window.clearInterval(interval_id);
    };
  }, []);

  if (now_seconds === null) {
    return null;
  }

  const bangkok_time = FormatBangkokTime(now_seconds);

  return (
    <time
      className="text-muted-foreground mr-2 hidden items-baseline gap-1 sm:inline-flex"
      aria-label={`เวลาประเทศไทย ${bangkok_time} น.`}
    >
      <span className="text-foreground text-sm font-bold tabular-nums">
        {bangkok_time}
      </span>
      <span className="text-xs">น.</span>
    </time>
  );
}

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between gap-2 px-4 lg:px-6">
        <Link
          href="/calendar"
          prefetch={false}
          className="focus-visible:ring-ring/50 flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-3"
        >
          <AppLoadingLinkStatus />
          <span
            className="on-air-dot inline-block size-2 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate text-base font-bold tracking-tight sm:text-lg">
            Anime Calendar
          </span>
          <span className="text-muted-foreground hidden text-sm lg:inline">
            ตารางอนิเมะ
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          <HeaderClock />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}

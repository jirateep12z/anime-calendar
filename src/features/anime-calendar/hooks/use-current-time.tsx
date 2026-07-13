'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import type { ReactNode } from 'react';

const DEFAULT_TICK_INTERVAL_MILLISECONDS = 1000;

const CalendarTimeContext = createContext<number | null>(null);

interface CalendarTimeProviderProps {
  readonly now_seconds: number;
  readonly children: ReactNode;
}

export function CalendarTimeProvider({
  now_seconds,
  children
}: CalendarTimeProviderProps) {
  return (
    <CalendarTimeContext.Provider value={now_seconds}>
      {children}
    </CalendarTimeContext.Provider>
  );
}

export function UseCalendarTime(): number {
  const now_seconds = useContext(CalendarTimeContext);

  if (now_seconds === null) {
    throw new Error('UseCalendarTime ต้องถูกใช้ภายใน CalendarTimeProvider');
  }

  return now_seconds;
}

export function UseCurrentTime(
  initial_now_seconds: number,
  tick_interval_milliseconds = DEFAULT_TICK_INTERVAL_MILLISECONDS
): number {
  const [now_seconds, set_now_seconds] = useState(initial_now_seconds);

  useEffect(() => {
    const UpdateCurrentTime = () => {
      set_now_seconds(Math.floor(Date.now() / 1000));
    };
    const timeout_id = window.setTimeout(UpdateCurrentTime, 0);
    const interval_id = window.setInterval(
      UpdateCurrentTime,
      tick_interval_milliseconds
    );

    return () => {
      window.clearTimeout(timeout_id);
      window.clearInterval(interval_id);
    };
  }, [tick_interval_milliseconds]);

  return now_seconds;
}

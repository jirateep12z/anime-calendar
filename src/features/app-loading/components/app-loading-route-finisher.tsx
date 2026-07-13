'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { FinishAppLoading } from '../services/app-loading-store';

export function AppLoadingRouteFinisher() {
  const pathname = usePathname();

  useEffect(() => {
    const is_calendar_route =
      pathname === '/calendar' || pathname.startsWith('/calendar/');

    if (!is_calendar_route) {
      FinishAppLoading();
    }
  }, [pathname]);

  return null;
}

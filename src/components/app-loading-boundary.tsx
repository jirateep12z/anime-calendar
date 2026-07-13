'use client';

import './app-loading.css';

import { useEffect, useRef, useState } from 'react';

import { AppLoadingAnimation } from '@/components/app-loading-animation';
import { AppLoadingRouteFinisher } from '@/components/app-loading-route-finisher';
import {
  APP_LOADING_FALLBACK_TIMEOUT_MS,
  APP_LOADING_MINIMUM_DURATION_MS
} from '@/constants/app-loading';
import { FinishAppLoading, UseAppLoadingState } from '@/context/app-loading';
import { Cn } from '@/lib/utils';

import type { ReactNode } from 'react';

interface AppLoadingBoundaryProps {
  readonly children: ReactNode;
}

function GetCurrentTime() {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

export function AppLoadingBoundary({ children }: AppLoadingBoundaryProps) {
  const loading_state = UseAppLoadingState();
  const mounted_at_ref = useRef(GetCurrentTime());
  const [is_overlay_visible, set_is_overlay_visible] = useState(true);

  useEffect(() => {
    if (loading_state.is_loading) return;

    const elapsed_time = GetCurrentTime() - mounted_at_ref.current;
    const remaining_duration = Math.max(
      0,
      APP_LOADING_MINIMUM_DURATION_MS - elapsed_time
    );
    const finish_timer_id = window.setTimeout(() => {
      set_is_overlay_visible(false);
    }, remaining_duration);

    return () => window.clearTimeout(finish_timer_id);
  }, [loading_state.is_loading]);

  useEffect(() => {
    if (!loading_state.is_loading) return;

    const fallback_timer_id = window.setTimeout(() => {
      FinishAppLoading();
    }, APP_LOADING_FALLBACK_TIMEOUT_MS);

    return () => window.clearTimeout(fallback_timer_id);
  }, [loading_state.is_loading]);

  return (
    <>
      <AppLoadingRouteFinisher />
      <div
        data-loading={is_overlay_visible}
        className="app-loading-overlay bg-background fixed inset-0 z-[9999] flex items-center justify-center"
        aria-hidden={is_overlay_visible ? undefined : true}
        inert={is_overlay_visible ? undefined : true}
      >
        <AppLoadingAnimation />
      </div>
      <div
        className={Cn(is_overlay_visible ? 'hidden' : 'contents')}
        aria-hidden={is_overlay_visible ? true : undefined}
      >
        {children}
      </div>
    </>
  );
}

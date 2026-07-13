'use client';

import type { AppLoadingState } from '../types/app-loading';

const subscribers = new Set<() => void>();

const INITIAL_APP_LOADING_STATE = Object.freeze({
  is_loading: true,
  started_at: 0
}) satisfies AppLoadingState;

let app_loading_state: AppLoadingState = INITIAL_APP_LOADING_STATE;

function EmitAppLoadingChange() {
  subscribers.forEach(notify => notify());
}

export function SubscribeAppLoading(notify: () => void) {
  subscribers.add(notify);

  return () => {
    subscribers.delete(notify);
  };
}

export function GetAppLoadingSnapshot() {
  return app_loading_state;
}

export function GetAppLoadingServerSnapshot() {
  return INITIAL_APP_LOADING_STATE;
}

export function FinishAppLoading() {
  if (!app_loading_state.is_loading) return;

  app_loading_state = Object.freeze({
    ...app_loading_state,
    is_loading: false
  });
  EmitAppLoadingChange();
}

'use client';

import { GetAppLoadingTime } from './app-loading-clock';

import type { AppLoadingState } from '../types/app-loading';

const subscribers = new Set<() => void>();
const pending_navigation_tokens = new Set<symbol>();

const INITIAL_APP_LOADING_STATE = Object.freeze({
  is_loading: true,
  started_at: null
}) satisfies AppLoadingState;

let app_loading_state: AppLoadingState = INITIAL_APP_LOADING_STATE;

function EmitAppLoadingChange() {
  subscribers.forEach(notify => notify());
}

function FinishNavigationLoading(navigation_token: symbol) {
  if (!pending_navigation_tokens.delete(navigation_token)) return;
  if (pending_navigation_tokens.size > 0) return;

  FinishAppLoading();
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

export function StartNavigationLoading() {
  const navigation_token = Symbol('app-loading-navigation');

  pending_navigation_tokens.add(navigation_token);

  if (!app_loading_state.is_loading) {
    app_loading_state = Object.freeze({
      is_loading: true,
      started_at: GetAppLoadingTime()
    });
    EmitAppLoadingChange();
  }

  return () => FinishNavigationLoading(navigation_token);
}

export function FinishAppLoading() {
  pending_navigation_tokens.clear();

  if (!app_loading_state.is_loading) return;

  app_loading_state = Object.freeze({
    ...app_loading_state,
    is_loading: false
  });
  EmitAppLoadingChange();
}

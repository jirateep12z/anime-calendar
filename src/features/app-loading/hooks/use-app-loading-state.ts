'use client';

import { useSyncExternalStore } from 'react';

import {
  GetAppLoadingServerSnapshot,
  GetAppLoadingSnapshot,
  SubscribeAppLoading
} from '../services/app-loading-store';

export function UseAppLoadingState() {
  return useSyncExternalStore(
    SubscribeAppLoading,
    GetAppLoadingSnapshot,
    GetAppLoadingServerSnapshot
  );
}

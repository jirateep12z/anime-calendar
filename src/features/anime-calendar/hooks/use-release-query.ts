'use client';

import { useCallback, useSyncExternalStore } from 'react';

function ParseReleaseId(search_text: string): number | null {
  const release_value = new URLSearchParams(search_text).get('release');

  if (release_value === null || !/^\d+$/.test(release_value)) {
    return null;
  }

  const release_id = Number(release_value);

  return Number.isSafeInteger(release_id) && release_id > 0 ? release_id : null;
}

function SubscribeToHistory(HandleHistoryChange: () => void): () => void {
  window.addEventListener('popstate', HandleHistoryChange);

  return () => window.removeEventListener('popstate', HandleHistoryChange);
}

function ReadReleaseSnapshot(): number | null {
  return ParseReleaseId(window.location.search);
}

function ReadServerReleaseSnapshot(): null {
  return null;
}

function NotifyHistoryChange(): void {
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function UseReleaseQuery(): {
  readonly selected_release_id: number | null;
  readonly OpenRelease: (release_id: number) => void;
  readonly CloseRelease: () => void;
} {
  const selected_release_id = useSyncExternalStore(
    SubscribeToHistory,
    ReadReleaseSnapshot,
    ReadServerReleaseSnapshot
  );

  const OpenRelease = useCallback((release_id: number) => {
    if (!Number.isSafeInteger(release_id) || release_id <= 0) {
      return;
    }

    const release_url = new URL(window.location.href);

    release_url.searchParams.set('release', release_id.toString());
    window.history.pushState({}, '', release_url);
    NotifyHistoryChange();
  }, []);

  const CloseRelease = useCallback(() => {
    const release_url = new URL(window.location.href);

    release_url.searchParams.delete('release');
    window.history.replaceState({}, '', release_url);
    NotifyHistoryChange();
  }, []);

  return Object.freeze({
    selected_release_id,
    OpenRelease,
    CloseRelease
  });
}

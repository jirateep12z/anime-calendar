import { useSyncExternalStore } from 'react';

const COMPACT_VIEWPORT_BREAKPOINT_PX = 1024;
const COMPACT_VIEWPORT_MEDIA_QUERY = `(max-width: ${COMPACT_VIEWPORT_BREAKPOINT_PX - 1}px)`;

export function UseIsCompactViewport() {
  return useSyncExternalStore(
    SubscribeCompactViewportChanges,
    GetCompactViewportSnapshot,
    GetCompactViewportServerSnapshot
  );
}

function SubscribeCompactViewportChanges(on_store_change: () => void) {
  const media_query = window.matchMedia(COMPACT_VIEWPORT_MEDIA_QUERY);

  media_query.addEventListener('change', on_store_change);

  return () => media_query.removeEventListener('change', on_store_change);
}

function GetCompactViewportSnapshot() {
  return window.matchMedia(COMPACT_VIEWPORT_MEDIA_QUERY).matches;
}

function GetCompactViewportServerSnapshot() {
  return false;
}

import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

export function UseIsMobile() {
  return useSyncExternalStore(
    SubscribeMobileChanges,
    GetMobileSnapshot,
    GetMobileServerSnapshot
  );
}

function SubscribeMobileChanges(on_store_change: () => void) {
  const media_query = window.matchMedia(MOBILE_MEDIA_QUERY);

  media_query.addEventListener('change', on_store_change);

  return () => media_query.removeEventListener('change', on_store_change);
}

function GetMobileSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function GetMobileServerSnapshot() {
  return false;
}

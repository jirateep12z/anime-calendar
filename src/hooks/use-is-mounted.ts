import { useSyncExternalStore } from 'react';

export function UseIsMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

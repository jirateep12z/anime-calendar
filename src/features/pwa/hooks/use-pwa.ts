'use client';

import { useContext } from 'react';

import { PwaContext } from '../providers/pwa-provider';

import type { PwaState } from '../types/pwa';

export function UsePwa(): PwaState {
  const pwa_state = useContext(PwaContext);

  if (pwa_state === null) {
    throw new Error('UsePwa must be used within PwaProvider.');
  }

  return pwa_state;
}

'use client';

import { useLinkStatus } from 'next/link';
import { useEffect } from 'react';

import { StartNavigationLoading } from '../services/app-loading-store';

export function AppLoadingLinkStatus() {
  const { pending } = useLinkStatus();

  useEffect(() => {
    if (!pending) return;

    return StartNavigationLoading();
  }, [pending]);

  return null;
}

'use client';

import { usePathname } from 'next/navigation';

export function UseNormalizedPathname(): string {
  const pathname = usePathname() ?? '';

  return pathname.replace(/\/+$/, '') || '/';
}

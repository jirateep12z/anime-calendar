'use client';

import Link from 'next/link';

import { AppLoadingLinkStatus } from '@/features/app-loading';
import { Cn } from '@/lib/utils';
import { APP_NAVIGATION_ITEMS } from '../constants/app-navigation';
import { UseNormalizedPathname } from '../hooks/use-normalized-pathname';

export function AppBottomNav() {
  const normalized_pathname = UseNormalizedPathname();

  return (
    <nav
      aria-label="เมนูหลัก"
      className="bg-background/90 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="grid h-16 grid-cols-3">
        {APP_NAVIGATION_ITEMS.map(navigation_item => {
          const is_active = normalized_pathname === navigation_item.href;
          const NavigationIcon = navigation_item.icon;

          return (
            <Link
              key={navigation_item.href}
              href={navigation_item.href}
              prefetch={false}
              aria-current={is_active ? 'page' : undefined}
              className={Cn(
                'focus-visible:ring-ring/50 flex flex-col items-center justify-center gap-1 text-xs outline-none focus-visible:ring-3 focus-visible:ring-inset',
                is_active
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              <AppLoadingLinkStatus />
              <NavigationIcon className="size-5" aria-hidden="true" />
              <span>{navigation_item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

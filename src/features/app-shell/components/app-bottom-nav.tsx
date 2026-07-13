'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AppLoadingLinkStatus } from '@/features/app-loading';
import { Cn } from '@/lib/utils';
import { APP_BOTTOM_NAV_BOTTOM_OFFSET } from '../constants/app-bottom-nav-layout';
import { APP_NAVIGATION_ITEMS } from '../constants/app-navigation';
import { UseLayoutChangeTransitionSuppression } from '../hooks/use-layout-change-transition-suppression';
import { UseNormalizedPathname } from '../hooks/use-normalized-pathname';
import { UseScrollHidden } from '../hooks/use-scroll-hidden';

import type { CSSProperties, FocusEvent, PointerEvent } from 'react';

const SIDE_RAIL_MEDIA_QUERY = '(min-width: 110rem)';
const NAVIGATION_STYLE = Object.freeze({
  '--app-bottom-nav-offset': APP_BOTTOM_NAV_BOTTOM_OFFSET
}) as CSSProperties;
const NO_NAVIGATION_INDEX = -1;
const MOUSE_POINTER_TYPE = 'mouse';
const NAVIGATION_INDICATOR_CLASS_NAME =
  'bg-primary/15 absolute rounded-md transition-transform duration-300 ease-out motion-reduce:transition-none';
// Concentric with the standalone capsule: 2rem outer radius minus the 0.375rem (p-1.5) padding.
const STANDALONE_INNER_RADIUS_CLASS_NAME =
  '[@media(display-mode:standalone)]:max-[110rem]:rounded-[1.625rem]';

export function AppBottomNav() {
  const normalized_pathname = UseNormalizedPathname();
  const is_scroll_hidden = UseScrollHidden();
  const navigation_ref = UseLayoutChangeTransitionSuppression<HTMLElement>(
    SIDE_RAIL_MEDIA_QUERY
  );
  const [highlighted_index, set_highlighted_index] = useState<number | null>(
    null
  );
  const active_index = APP_NAVIGATION_ITEMS.findIndex(
    navigation_item => navigation_item.href === normalized_pathname
  );
  const indicator_index = highlighted_index ?? active_index;
  const is_indicator_visible = indicator_index !== NO_NAVIGATION_INDEX;

  const HandleNavigationBlur = (focus_event: FocusEvent<HTMLDivElement>) => {
    if (focus_event.currentTarget.contains(focus_event.relatedTarget)) return;

    set_highlighted_index(null);
  };

  const HandleNavigationPointerEnter = (
    navigation_index: number,
    pointer_event: PointerEvent<HTMLAnchorElement>
  ) => {
    if (pointer_event.pointerType !== MOUSE_POINTER_TYPE) return;

    set_highlighted_index(navigation_index);
  };

  return (
    <nav
      ref={navigation_ref}
      aria-label="เมนูหลัก"
      data-scroll-hidden={is_scroll_hidden}
      style={NAVIGATION_STYLE}
      className="bg-background/90 fixed inset-x-4 bottom-(--app-bottom-nav-offset) z-40 mx-auto max-w-md rounded-xl border backdrop-blur transition-[transform] duration-300 ease-out data-[layout-changing=true]:transition-none motion-reduce:transition-none max-[110rem]:data-[scroll-hidden=true]:not-focus-within:[transform:translateY(calc(100%+var(--app-bottom-nav-offset)))] min-[110rem]:top-1/2 min-[110rem]:right-[calc(1rem+env(safe-area-inset-right))] min-[110rem]:bottom-auto min-[110rem]:left-auto min-[110rem]:mx-0 min-[110rem]:-translate-y-1/2 min-[110rem]:data-[scroll-hidden=true]:not-focus-within:[transform:translateX(calc(100%+1rem+env(safe-area-inset-right)))] [@media(display-mode:standalone)]:max-[110rem]:rounded-[2rem]"
    >
      <div
        className="relative grid h-16 grid-cols-3 p-1.5 min-[110rem]:h-auto min-[110rem]:w-20 min-[110rem]:grid-cols-1 min-[110rem]:grid-rows-[repeat(3,4rem)]"
        style={
          { '--navigation-indicator-index': indicator_index } as CSSProperties
        }
        onBlur={HandleNavigationBlur}
        onPointerLeave={() => set_highlighted_index(null)}
      >
        {is_indicator_visible && (
          <>
            <span
              aria-hidden="true"
              className={Cn(
                NAVIGATION_INDICATOR_CLASS_NAME,
                'inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] translate-x-[calc(var(--navigation-indicator-index)*100%)] min-[110rem]:hidden',
                STANDALONE_INNER_RADIUS_CLASS_NAME
              )}
            />
            <span
              aria-hidden="true"
              className={Cn(
                NAVIGATION_INDICATOR_CLASS_NAME,
                'inset-x-1.5 top-1.5 hidden h-[calc((100%-0.75rem)/3)] translate-y-[calc(var(--navigation-indicator-index)*100%)] min-[110rem]:block'
              )}
            />
          </>
        )}
        {APP_NAVIGATION_ITEMS.map((navigation_item, navigation_index) => {
          const is_active = navigation_index === active_index;
          const is_highlighted = navigation_index === indicator_index;
          const NavigationIcon = navigation_item.icon;

          return (
            <Link
              key={navigation_item.href}
              href={navigation_item.href}
              prefetch={false}
              aria-current={is_active ? 'page' : undefined}
              className={Cn(
                'focus-visible:ring-ring/50 relative flex flex-col items-center justify-center gap-1 rounded-md text-xs outline-none focus-visible:ring-3 focus-visible:ring-inset',
                STANDALONE_INNER_RADIUS_CLASS_NAME,
                is_active && 'text-primary font-semibold',
                !is_active && is_highlighted && 'text-foreground',
                !is_active && !is_highlighted && 'text-muted-foreground'
              )}
              onFocus={() => set_highlighted_index(navigation_index)}
              onPointerEnter={pointer_event =>
                HandleNavigationPointerEnter(navigation_index, pointer_event)
              }
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

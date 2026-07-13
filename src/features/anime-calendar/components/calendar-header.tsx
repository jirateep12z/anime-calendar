'use client';

import './notification-ready-pulse.css';

import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { UseBookmarks } from '@/features/anime-bookmarks/client';
import { UseNotifications } from '@/features/anime-notifications/client';
import { ThemeSwitcher } from '@/features/theme';
import { BellIcon, CloudUploadIcon, SearchIcon } from 'lucide-react';

const ScheduleSearchDialog = dynamic(
  () =>
    import('./schedule-search-dialog').then(
      module => module.ScheduleSearchDialog
    ),
  { ssr: false }
);

const NotificationSettingsSheet = dynamic(
  () =>
    import('@/features/anime-notifications/client').then(
      module => module.NotificationSettingsSheet
    ),
  { ssr: false }
);

import type { ScheduleEntry } from '@/features/anime-schedule';

interface CalendarHeaderProps {
  readonly is_adult_confirmed: boolean;
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly selected_date: string;
  readonly HandleOpenScheduleEntry: (schedule_entry: ScheduleEntry) => void;
}

export function CalendarHeader({
  is_adult_confirmed,
  schedule_entries,
  selected_date,
  HandleOpenScheduleEntry
}: CalendarHeaderProps) {
  const { preferences } = UseNotifications();
  const { pending_media_ids } = UseBookmarks();
  const [is_search_loaded, set_is_search_loaded] = useState(false);
  const [is_search_open, set_is_search_open] = useState(false);
  const [is_notification_settings_loaded, set_is_notification_settings_loaded] =
    useState(false);
  const [is_notification_settings_open, set_is_notification_settings_open] =
    useState(false);

  return (
    <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="truncate text-base font-bold tracking-tight sm:text-lg">
            Anime Calendar
          </span>
          <span className="text-muted-foreground hidden text-sm sm:inline">
            ตารางอนิเมะ
          </span>
        </div>
        <div className="flex items-center gap-1">
          {pending_media_ids.size > 0 ? (
            <span
              className="text-muted-foreground mr-1 inline-flex items-center gap-1 text-xs"
              role="status"
            >
              <CloudUploadIcon data-icon="inline-start" aria-hidden="true" />
              รอซิงก์
            </span>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="relative"
                aria-label="ตั้งค่าการแจ้งเตือน"
                aria-describedby="notification-status"
                onClick={() => {
                  set_is_notification_settings_loaded(true);
                  set_is_notification_settings_open(true);
                }}
              >
                <BellIcon
                  className={
                    preferences.is_notification_enabled
                      ? 'notification-ready-pulse'
                      : undefined
                  }
                  aria-hidden="true"
                />
                {preferences.is_notification_enabled ? (
                  <span
                    className="bg-status-airing ring-background absolute top-2 right-2 size-2 rounded-full ring-2"
                    aria-hidden="true"
                  />
                ) : null}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">ตั้งค่าการแจ้งเตือน</TooltipContent>
          </Tooltip>
          <span id="notification-status" className="sr-only">
            {preferences.is_notification_enabled
              ? 'การแจ้งเตือนเปิดอยู่'
              : 'การแจ้งเตือนปิดอยู่'}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="ค้นหาอนิเมะ"
                data-search-active={is_search_open ? 'true' : 'false'}
                onClick={() => {
                  set_is_search_loaded(true);
                  set_is_search_open(true);
                }}
              >
                <SearchIcon aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">ค้นหาอนิเมะ</TooltipContent>
          </Tooltip>
          <ThemeSwitcher />
        </div>
      </div>
      {is_search_loaded ? (
        <ScheduleSearchDialog
          is_adult_confirmed={is_adult_confirmed}
          schedule_entries={schedule_entries}
          selected_date={selected_date}
          open={is_search_open}
          HandleOpenScheduleEntry={HandleOpenScheduleEntry}
          OnOpenChange={set_is_search_open}
        />
      ) : null}
      {is_notification_settings_loaded ? (
        <NotificationSettingsSheet
          schedule_entries={schedule_entries}
          open={is_notification_settings_open}
          OnOpenChange={set_is_notification_settings_open}
        />
      ) : null}
    </header>
  );
}

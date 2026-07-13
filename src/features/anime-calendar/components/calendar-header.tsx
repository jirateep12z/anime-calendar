'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { UseNotifications } from '@/features/anime-notifications/hooks/use-notifications';
import { UseIsMounted } from '@/hooks/use-is-mounted';
import {
  BellIcon,
  CloudUploadIcon,
  MonitorIcon,
  MoonIcon,
  SearchIcon,
  SunIcon
} from 'lucide-react';

const ScheduleSearchDialog = dynamic(
  () =>
    import('./schedule-search-dialog').then(
      module => module.ScheduleSearchDialog
    ),
  { ssr: false }
);

const NotificationSettingsSheet = dynamic(
  () =>
    import('@/features/anime-notifications/components/notification-settings-sheet').then(
      module => module.NotificationSettingsSheet
    ),
  { ssr: false }
);

import type { ThemeMode } from '@/types/theme';
import type { ScheduleEntry } from '../types/schedule';

interface CalendarHeaderProps {
  readonly theme_mode: ThemeMode;
  readonly is_adult_confirmed: boolean;
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly selected_date: string;
  readonly HandleOpenScheduleEntry: (schedule_entry: ScheduleEntry) => void;
  readonly HandleThemeChange: (theme_mode: ThemeMode) => void;
}

const NEXT_THEME_BY_MODE: Readonly<Record<ThemeMode, ThemeMode>> = {
  system: 'light',
  light: 'dark',
  dark: 'system'
};

export function CalendarHeader({
  theme_mode,
  is_adult_confirmed,
  schedule_entries,
  selected_date,
  HandleOpenScheduleEntry,
  HandleThemeChange
}: CalendarHeaderProps) {
  const is_mounted = UseIsMounted();
  const { preferences, pending_media_ids } = UseNotifications();
  const [is_search_loaded, set_is_search_loaded] = useState(false);
  const [is_search_open, set_is_search_open] = useState(false);
  const [is_notification_settings_loaded, set_is_notification_settings_loaded] =
    useState(false);
  const [is_notification_settings_open, set_is_notification_settings_open] =
    useState(false);
  const visible_theme_mode = is_mounted ? theme_mode : 'system';
  const ThemeIcon =
    visible_theme_mode === 'light'
      ? SunIcon
      : visible_theme_mode === 'dark'
        ? MoonIcon
        : MonitorIcon;

  const HandleCycleTheme = () => {
    HandleThemeChange(NEXT_THEME_BY_MODE[theme_mode]);
  };

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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="เปลี่ยนธีม"
                onClick={HandleCycleTheme}
              >
                <ThemeIcon data-icon="inline-start" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">เปลี่ยนธีม</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {is_search_loaded ? (
        <ScheduleSearchDialog
          is_adult_confirmed={is_adult_confirmed}
          schedule_entries={schedule_entries}
          selected_date={selected_date}
          open={is_search_open}
          onOpenChange={set_is_search_open}
          HandleOpenScheduleEntry={HandleOpenScheduleEntry}
        />
      ) : null}
      {is_notification_settings_loaded ? (
        <NotificationSettingsSheet
          schedule_entries={schedule_entries}
          open={is_notification_settings_open}
          onOpenChange={set_is_notification_settings_open}
        />
      ) : null}
    </header>
  );
}

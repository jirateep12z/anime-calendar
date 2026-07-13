'use client';

import dynamic from 'next/dynamic';
import {
  startTransition as StartTransition,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import { FinishAppLoading } from '@/context/app-loading';
import { UseInAppNotificationFallback } from '@/features/anime-notifications/hooks/use-in-app-notification-fallback';
import { UseNotifications } from '@/features/anime-notifications/hooks/use-notifications';
import { UsePwa } from '@/features/pwa/hooks/use-pwa';
import { UseTheme } from '@/features/theme/providers/theme-provider';
import {
  BROADCAST_STATUSES,
  DEFAULT_SCHEDULE_FILTER,
  SUPPORTED_FORMATS
} from '../constants/schedule';
import {
  CalendarTimeProvider,
  UseCurrentTime
} from '../hooks/use-current-time';
import { UseReleaseQuery } from '../hooks/use-release-query';
import { UseScheduleQuery } from '../hooks/use-schedule-query';
import { CreateAnimeDetailFromSchedule } from '../services/create-anime-detail-model';
import { FilterScheduleEntries } from '../services/filter-schedule';
import { FindUpcomingScheduleEntries } from '../services/find-upcoming-schedule';
import { GroupScheduleEntries } from '../services/group-schedule';
import {
  ReadStoredSchedulePreferences,
  WriteSchedulePreferencesToUrl,
  WriteStoredSchedulePreferences
} from '../services/schedule-preference-storage';
import { ParseSchedulePreferences } from '../services/schedule-preferences';
import {
  CreateBangkokScheduleRangeForDateKey,
  CreateScheduleDateKeys,
  FormatBangkokDate
} from '../utils/schedule-time';
import { CalendarHeader } from './calendar-header';
import { ScheduleEmptyState } from './schedule-empty-state';
import { ScheduleErrorState } from './schedule-error-state';
import { ScheduleLoadingState } from './schedule-loading-state';
import { ScheduleStatusBar } from './schedule-status-bar';
import { ScheduleToolbar } from './schedule-toolbar';
import { TimelineScheduleView } from './timeline-schedule-view';
import { UpcomingReleaseBanner } from './upcoming-release-banner';
import { WeeklyScheduleView } from './weekly-schedule-view';

import type { ThemeMode } from '@/types/theme';
import type {
  ScheduleEntry,
  ScheduleFilter,
  ScheduleInitialData,
  SchedulePreferences,
  ScheduleViewMode
} from '../types/schedule';

const AnimeDetailDialog = dynamic(
  () =>
    import('./anime-detail-dialog').then(module => module.AnimeDetailDialog),
  { ssr: false }
);
const AdultConfirmationDialog = dynamic(
  () =>
    import('./adult-confirmation-dialog').then(
      module => module.AdultConfirmationDialog
    ),
  { ssr: false }
);

const DEFAULT_PREFERENCES: SchedulePreferences = Object.freeze({
  view_mode: 'WEEKLY',
  search_query: '',
  selected_date: null,
  filter: DEFAULT_SCHEDULE_FILTER,
  is_adult_confirmed: false
});

interface CalendarClientProps {
  readonly initial_schedule_data: ScheduleInitialData | null;
  readonly initial_now_seconds: number;
}

export function CalendarClient({
  initial_schedule_data,
  initial_now_seconds
}: CalendarClientProps) {
  const { is_online } = UsePwa();
  const { SyncAdultPreference } = UseNotifications();
  const { theme_mode, ChangeTheme } = UseTheme();
  const now_seconds = UseCurrentTime(initial_now_seconds);
  const bangkok_today = FormatBangkokDate(now_seconds);
  const schedule_range = useMemo(
    () => CreateBangkokScheduleRangeForDateKey(bangkok_today),
    [bangkok_today]
  );
  const schedule_dates = useMemo(
    () => CreateScheduleDateKeys(schedule_range),
    [schedule_range]
  );
  const schedule_query = UseScheduleQuery(
    schedule_range,
    initial_schedule_data,
    is_online
  );

  useEffect(() => {
    if (!schedule_query.is_initial_loading) {
      FinishAppLoading();
    }
  }, [schedule_query.is_initial_loading]);

  const { selected_release_id, OpenRelease, CloseRelease } = UseReleaseQuery();
  const [preferences, set_preferences] =
    useState<SchedulePreferences>(DEFAULT_PREFERENCES);
  const [is_adult_confirmation_open, set_is_adult_confirmation_open] =
    useState(false);

  const upcoming_schedule_entries = useMemo(
    () =>
      FindUpcomingScheduleEntries(
        schedule_query.schedule_entries,
        now_seconds,
        preferences.is_adult_confirmed
      ),
    [
      now_seconds,
      preferences.is_adult_confirmed,
      schedule_query.schedule_entries
    ]
  );

  useEffect(() => {
    const stored_preferences = ReadStoredSchedulePreferences(
      window.localStorage
    );
    const hydrated_preferences = ParseSchedulePreferences(
      new URLSearchParams(window.location.search),
      stored_preferences
    );
    const selected_date =
      hydrated_preferences.selected_date !== null &&
      schedule_dates.includes(hydrated_preferences.selected_date)
        ? hydrated_preferences.selected_date
        : schedule_range.range_start_date;

    StartTransition(() => {
      set_preferences(
        Object.freeze({ ...hydrated_preferences, selected_date })
      );
    });
    void SyncAdultPreference(
      hydrated_preferences.is_adult_confirmed,
      hydrated_preferences.filter.is_adult_content_visible
    );
  }, [SyncAdultPreference, schedule_dates, schedule_range.range_start_date]);

  const UpdatePreferences = useCallback(
    (next_preferences: SchedulePreferences) => {
      const immutable_preferences = Object.freeze({
        ...next_preferences,
        filter: Object.freeze({ ...next_preferences.filter })
      });

      set_preferences(immutable_preferences);

      if (typeof window !== 'undefined') {
        WriteStoredSchedulePreferences(
          window.localStorage,
          immutable_preferences
        );
        WriteSchedulePreferencesToUrl(immutable_preferences);
      }
    },
    []
  );

  const HandleThemeChange = (selected_theme_mode: ThemeMode) => {
    ChangeTheme(selected_theme_mode);
  };

  const HandleViewModeChange = useCallback(
    (view_mode: ScheduleViewMode) => {
      UpdatePreferences({ ...preferences, view_mode });
    },
    [UpdatePreferences, preferences]
  );

  const HandleFilterChange = useCallback(
    (filter: ScheduleFilter) => {
      UpdatePreferences({ ...preferences, filter });
    },
    [UpdatePreferences, preferences]
  );

  const HandleSelectDate = useCallback(
    (selected_date: string) => {
      UpdatePreferences({ ...preferences, selected_date });
    },
    [UpdatePreferences, preferences]
  );

  const HandleAdultVisibilityChange = useCallback(
    (is_visible: boolean) => {
      if (is_visible && !preferences.is_adult_confirmed) {
        set_is_adult_confirmation_open(true);

        return;
      }

      UpdatePreferences({
        ...preferences,
        filter: {
          ...preferences.filter,
          is_adult_content_visible: is_visible
        }
      });
      void SyncAdultPreference(preferences.is_adult_confirmed, is_visible);
    },
    [SyncAdultPreference, UpdatePreferences, preferences]
  );

  const filtered_schedule_entries = useMemo(
    () =>
      FilterScheduleEntries(
        schedule_query.schedule_entries,
        preferences.filter,
        '',
        now_seconds
      ),
    [now_seconds, preferences.filter, schedule_query.schedule_entries]
  );
  const grouped_schedule_entries = useMemo(
    () => GroupScheduleEntries(filtered_schedule_entries),
    [filtered_schedule_entries]
  );
  const selected_release_entry = useMemo(
    () =>
      schedule_query.schedule_entries.find(
        schedule_entry =>
          schedule_entry.anilist_schedule_id === selected_release_id
      ) ?? null,
    [selected_release_id, schedule_query.schedule_entries]
  );
  const is_direct_adult_confirmation_required =
    selected_release_entry?.is_adult === true &&
    !preferences.is_adult_confirmed;
  const visible_release_entry = is_direct_adult_confirmation_required
    ? null
    : selected_release_entry;
  const has_active_filter =
    preferences.filter.is_aired_hidden ||
    preferences.filter.is_adult_content_visible ||
    preferences.filter.statuses.length !== BROADCAST_STATUSES.length ||
    preferences.filter.formats.length !== SUPPORTED_FORMATS.length;
  const refresh_status =
    (!is_online || schedule_query.is_network_unavailable) &&
    schedule_query.schedule_entries.length > 0
      ? 'OFFLINE'
      : schedule_query.has_refresh_error
        ? 'CACHED_WARNING'
        : schedule_query.is_fetching
          ? 'FETCHING'
          : 'IDLE';

  const HandleOpenEntry = useCallback(
    (schedule_entry: ScheduleEntry) => {
      OpenRelease(schedule_entry.anilist_schedule_id);
    },
    [OpenRelease]
  );

  const HandleConfirmAdultContent = () => {
    UpdatePreferences({
      ...preferences,
      filter: {
        ...preferences.filter,
        is_adult_content_visible: true
      },
      is_adult_confirmed: true
    });
    void SyncAdultPreference(true, true);
    set_is_adult_confirmation_open(false);
  };

  const HandleCancelAdultContent = () => {
    set_is_adult_confirmation_open(false);
    if (is_direct_adult_confirmation_required) {
      CloseRelease();
    }
  };

  const HandleResetFilters = () => {
    UpdatePreferences({
      ...preferences,
      search_query: '',
      filter: Object.freeze({
        ...DEFAULT_SCHEDULE_FILTER,
        is_adult_content_visible: false
      })
    });
    void SyncAdultPreference(preferences.is_adult_confirmed, false);
  };

  const HandleRefresh = () => {
    void schedule_query.Refetch();
  };

  UseInAppNotificationFallback(
    schedule_query.schedule_entries,
    now_seconds,
    OpenRelease
  );

  return (
    <CalendarTimeProvider now_seconds={now_seconds}>
      <div className="bg-background min-h-screen">
        <CalendarHeader
          theme_mode={theme_mode}
          is_adult_confirmed={preferences.is_adult_confirmed}
          schedule_entries={schedule_query.schedule_entries}
          selected_date={
            preferences.selected_date ?? schedule_range.range_start_date
          }
          HandleOpenScheduleEntry={HandleOpenEntry}
          HandleThemeChange={HandleThemeChange}
        />
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section
            aria-labelledby="calendar-title"
            className="flex flex-col gap-2"
          >
            <h1
              id="calendar-title"
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              ตารางออกอากาศอนิเมะ
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
              ติดตามเวลาออกอากาศในประเทศไทยตลอดเจ็ดวันข้างหน้า
            </p>
          </section>
          <ScheduleStatusBar
            range_label={`${schedule_query.displayed_range.range_start_date} – ${schedule_query.displayed_range.range_end_date}`}
            refresh_status={refresh_status}
            last_updated_at={schedule_query.last_updated_at}
            HandleRetry={HandleRefresh}
          />
          {!schedule_query.is_initial_loading &&
          !schedule_query.has_initial_error ? (
            <UpcomingReleaseBanner
              schedule_entries={upcoming_schedule_entries}
              HandleOpenEntry={HandleOpenEntry}
            />
          ) : null}
          <ScheduleToolbar
            view_mode={preferences.view_mode}
            filter={preferences.filter}
            is_refreshing={schedule_query.is_fetching}
            HandleViewModeChange={HandleViewModeChange}
            HandleFilterChange={HandleFilterChange}
            HandleAdultVisibilityChange={HandleAdultVisibilityChange}
            HandleRefresh={HandleRefresh}
          />
          {schedule_query.is_initial_loading ? (
            <ScheduleLoadingState />
          ) : schedule_query.has_initial_error ? (
            <ScheduleErrorState HandleRetry={HandleRefresh} />
          ) : filtered_schedule_entries.length === 0 ? (
            <ScheduleEmptyState
              has_active_filter={has_active_filter}
              HandleReset={HandleResetFilters}
            />
          ) : preferences.view_mode === 'WEEKLY' ? (
            <WeeklyScheduleView
              schedule_dates={schedule_dates}
              grouped_entries={grouped_schedule_entries}
              selected_date={
                preferences.selected_date ?? schedule_range.range_start_date
              }
              HandleSelectDate={HandleSelectDate}
              HandleOpenEntry={HandleOpenEntry}
            />
          ) : (
            <TimelineScheduleView
              schedule_dates={schedule_dates}
              grouped_entries={grouped_schedule_entries}
              HandleOpenEntry={HandleOpenEntry}
            />
          )}
          <footer className="text-muted-foreground border-t pt-4 text-xs">
            แหล่งข้อมูล: AniList • เวลา Asia/Bangkok
          </footer>
        </main>
        {visible_release_entry ? (
          <AnimeDetailDialog
            detail_model={CreateAnimeDetailFromSchedule(
              visible_release_entry,
              now_seconds
            )}
            HandleClose={CloseRelease}
          />
        ) : null}
        {is_adult_confirmation_open || is_direct_adult_confirmation_required ? (
          <AdultConfirmationDialog
            is_open={
              is_adult_confirmation_open ||
              is_direct_adult_confirmation_required
            }
            HandleConfirm={HandleConfirmAdultContent}
            HandleCancel={HandleCancelAdultContent}
          />
        ) : null}
      </div>
    </CalendarTimeProvider>
  );
}

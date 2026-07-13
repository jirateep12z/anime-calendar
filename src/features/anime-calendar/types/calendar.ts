import type {
  AniListFormat,
  BroadcastStatus,
  ScheduleInitialData
} from '@/features/anime-schedule';

export type ScheduleViewMode = 'WEEKLY' | 'TIMELINE';

export interface ScheduleFilter {
  readonly statuses: readonly BroadcastStatus[];
  readonly formats: readonly AniListFormat[];
  readonly is_adult_content_visible: boolean;
  readonly is_aired_hidden: boolean;
}

export interface SchedulePreferences {
  readonly view_mode: ScheduleViewMode;
  readonly search_query: string;
  readonly selected_date: string | null;
  readonly filter: ScheduleFilter;
  readonly is_adult_confirmed: boolean;
}

export interface CalendarClientProps {
  readonly initial_schedule_data: ScheduleInitialData | null;
  readonly initial_now_seconds: number;
}

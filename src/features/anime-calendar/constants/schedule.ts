import type {
  AniListFormat,
  BroadcastStatus,
  ScheduleFilter,
  ScheduleViewMode
} from '../types/schedule';

export const BANGKOK_TIME_ZONE = 'Asia/Bangkok';
export const SCHEDULE_CACHE_KEY = 'anime-calendar:schedule-cache:v2';
export const THEME_PREFERENCE_KEY = 'anime-calendar:theme-preference:v1';
export const VIEW_PREFERENCE_KEY = 'anime-calendar:view-preference:v1';
export const FILTER_PREFERENCE_KEY = 'anime-calendar:filter-preference:v1';
export const ADULT_CONFIRMATION_KEY = 'anime-calendar:adult-confirmation:v1';
export const SCHEDULE_CACHE_SCHEMA_VERSION = 2;
export const DEFAULT_DURATION_MINUTES = 24;
export const SCHEDULE_RANGE_DAY_COUNT = 7;
export const SCHEDULE_CACHE_MAX_AGE_MILLISECONDS = 15 * 60 * 1000;

export const SUPPORTED_FORMATS = [
  'TV',
  'ONA'
] as const satisfies readonly AniListFormat[];
export const BROADCAST_STATUSES = [
  'UPCOMING',
  'AIRING',
  'AIRED'
] as const satisfies readonly BroadcastStatus[];
export const AIRING_BADGE_CLASS_NAME =
  'bg-[#d7f3f5] text-[#00515a] dark:bg-[#164e56] dark:text-[#b8f4f7]';
export const DEFAULT_VIEW_MODE: ScheduleViewMode = 'WEEKLY';
export const DEFAULT_SCHEDULE_FILTER: ScheduleFilter = Object.freeze({
  statuses: BROADCAST_STATUSES,
  formats: SUPPORTED_FORMATS,
  is_adult_content_visible: false,
  is_aired_hidden: false
});

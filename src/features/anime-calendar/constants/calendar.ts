import {
  BROADCAST_STATUSES,
  SUPPORTED_FORMATS
} from '@/features/anime-schedule';
import type { ScheduleFilter, ScheduleViewMode } from '../types/calendar';

export const THEME_PREFERENCE_KEY = 'anime-calendar:theme-preference:v1';
export const VIEW_PREFERENCE_KEY = 'anime-calendar:view-preference:v1';
export const FILTER_PREFERENCE_KEY = 'anime-calendar:filter-preference:v1';
export const ADULT_CONFIRMATION_KEY = 'anime-calendar:adult-confirmation:v1';

export const AIRING_BADGE_CLASS_NAME =
  'bg-[#d7f3f5] text-[#00515a] dark:bg-[#164e56] dark:text-[#b8f4f7]';
export const DEFAULT_VIEW_MODE: ScheduleViewMode = 'WEEKLY';
export const DEFAULT_SCHEDULE_FILTER: ScheduleFilter = Object.freeze({
  statuses: BROADCAST_STATUSES,
  formats: SUPPORTED_FORMATS,
  is_adult_content_visible: false,
  is_aired_hidden: false
});

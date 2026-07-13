import type { BroadcastStatus } from '../types/schedule';

export const BANGKOK_TIME_ZONE = 'Asia/Bangkok';
export const SCHEDULE_CACHE_KEY = 'anime-calendar:schedule-cache:v2';
export const SCHEDULE_CACHE_SCHEMA_VERSION = 2;
export const DEFAULT_DURATION_MINUTES = 24;
export const SCHEDULE_RANGE_DAY_COUNT = 7;
export const SCHEDULE_CACHE_MAX_AGE_MILLISECONDS = 15 * 60 * 1000;

export const SUPPORTED_FORMATS = [
  'TV',
  'TV_SHORT',
  'MOVIE',
  'SPECIAL',
  'OVA',
  'ONA',
  'MUSIC'
] as const;
export const LEGACY_SCHEDULE_FORMATS = ['TV', 'ONA'] as const;
export const BROADCAST_STATUSES = [
  'UPCOMING',
  'AIRING',
  'AIRED'
] as const satisfies readonly BroadcastStatus[];

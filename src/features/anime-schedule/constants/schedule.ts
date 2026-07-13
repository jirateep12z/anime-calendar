import type { AniListFormat, BroadcastStatus } from '../types/schedule';

export const BANGKOK_TIME_ZONE = 'Asia/Bangkok';
export const SCHEDULE_CACHE_KEY = 'anime-calendar:schedule-cache:v2';
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

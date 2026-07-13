import type { AnimeSeason } from '@/features/anime-schedule';
import type { CompletedBookmarkFilter } from '../types/completed-bookmark';

export const DEFAULT_COMPLETED_BOOKMARK_FILTER: CompletedBookmarkFilter =
  Object.freeze({ season_year: 'ALL', season: 'ALL' });

export const COMPLETED_BOOKMARK_SEASON_LABELS: Readonly<
  Record<AnimeSeason, string>
> = Object.freeze({
  WINTER: 'Winter',
  SPRING: 'Spring',
  SUMMER: 'Summer',
  FALL: 'Fall'
});

export const UNKNOWN_RELEASE_PERIOD_LABEL = 'ไม่ระบุปี/ฤดูกาล';

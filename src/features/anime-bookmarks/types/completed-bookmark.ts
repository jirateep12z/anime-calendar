import type { AnimeSeason } from '@/features/anime-schedule';
import type { BookmarkCatalogEntry } from './bookmark';

export type CompletedBookmarkYearFilter = number | 'ALL' | 'UNKNOWN';
export type CompletedBookmarkSeasonFilter = AnimeSeason | 'ALL' | 'UNKNOWN';

export interface CompletedBookmarkFilter {
  readonly season_year: CompletedBookmarkYearFilter;
  readonly season: CompletedBookmarkSeasonFilter;
}

export interface CompletedBookmarkFilterOption<
  FilterValue extends string | number
> {
  readonly filter_value: FilterValue;
  readonly label: string;
}

export interface CompletedBookmarkGroup {
  readonly group_key: string;
  readonly label: string;
  readonly entries: readonly BookmarkCatalogEntry[];
}

export interface CompletedBookmarkView {
  readonly groups: readonly CompletedBookmarkGroup[];
  readonly filtered_count: number;
  readonly total_count: number;
  readonly year_options: readonly CompletedBookmarkFilterOption<CompletedBookmarkYearFilter>[];
  readonly season_options: readonly CompletedBookmarkFilterOption<CompletedBookmarkSeasonFilter>[];
}

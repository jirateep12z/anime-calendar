import { ANIME_SEASONS } from '@/features/anime-schedule';
import {
  COMPLETED_BOOKMARK_SEASON_LABELS,
  UNKNOWN_RELEASE_PERIOD_LABEL
} from '../constants/completed-bookmarks';

import type { BookmarkCatalogEntry } from '../types/bookmark';
import type {
  CompletedBookmarkFilter,
  CompletedBookmarkFilterOption,
  CompletedBookmarkSeasonFilter,
  CompletedBookmarkView,
  CompletedBookmarkYearFilter
} from '../types/completed-bookmark';

export function FormatCompletedBookmarkReleasePeriod(
  entry: Pick<BookmarkCatalogEntry, 'season' | 'season_year'>
): string {
  const { season, season_year } = entry;

  if (season == null && season_year == null)
    return UNKNOWN_RELEASE_PERIOD_LABEL;
  if (season == null) return 'ปี ' + season_year + ' · ไม่ระบุฤดูกาล';
  if (season_year == null) {
    return COMPLETED_BOOKMARK_SEASON_LABELS[season] + ' · ไม่ระบุปี';
  }

  return COMPLETED_BOOKMARK_SEASON_LABELS[season] + ' ' + season_year;
}

function MatchesFilter(
  selected_value: string | number,
  actual_value: string | number | null | undefined
): boolean {
  if (selected_value === 'ALL') return true;
  if (selected_value === 'UNKNOWN') return actual_value == null;

  return selected_value === actual_value;
}

function CompareCompletedEntries(
  left_entry: BookmarkCatalogEntry,
  right_entry: BookmarkCatalogEntry
): number {
  const left_year = left_entry.season_year;
  const right_year = right_entry.season_year;
  const left_season = left_entry.season;
  const right_season = right_entry.season;
  const left_has_period = left_year != null && left_season != null;
  const right_has_period = right_year != null && right_season != null;

  if (left_has_period !== right_has_period) return left_has_period ? -1 : 1;
  if (
    left_year != null &&
    right_year != null &&
    left_season != null &&
    right_season != null
  ) {
    const period_order =
      right_year - left_year ||
      ANIME_SEASONS.indexOf(right_season) - ANIME_SEASONS.indexOf(left_season);

    if (period_order !== 0) return period_order;
  }

  return (
    left_entry.title.primary.localeCompare(right_entry.title.primary, 'th') ||
    left_entry.anilist_media_id - right_entry.anilist_media_id
  );
}

export function BuildCompletedBookmarkView(
  completed_entries: readonly BookmarkCatalogEntry[],
  filter: CompletedBookmarkFilter
): CompletedBookmarkView {
  const known_years = new Set<number>();

  for (const entry of completed_entries) {
    if (entry.season_year != null) known_years.add(entry.season_year);
  }

  if (typeof filter.season_year === 'number')
    known_years.add(filter.season_year);

  const year_options: CompletedBookmarkFilterOption<CompletedBookmarkYearFilter>[] =
    [
      { filter_value: 'ALL', label: 'ทุกปี' },
      ...[...known_years]
        .sort((left_year, right_year) => right_year - left_year)
        .map(season_year => ({
          filter_value: season_year,
          label: String(season_year)
        }))
    ];
  const season_options: CompletedBookmarkFilterOption<CompletedBookmarkSeasonFilter>[] =
    [
      { filter_value: 'ALL', label: 'ทุกฤดูกาล' },
      ...ANIME_SEASONS.map(season => ({
        filter_value: season,
        label: COMPLETED_BOOKMARK_SEASON_LABELS[season]
      }))
    ];

  if (
    filter.season_year === 'UNKNOWN' ||
    completed_entries.some(entry => entry.season_year == null)
  ) {
    year_options.push({ filter_value: 'UNKNOWN', label: 'ไม่ระบุปี' });
  }

  if (
    filter.season === 'UNKNOWN' ||
    completed_entries.some(entry => entry.season == null)
  ) {
    season_options.push({ filter_value: 'UNKNOWN', label: 'ไม่ระบุฤดูกาล' });
  }

  const filtered_entries = completed_entries
    .filter(
      entry =>
        MatchesFilter(filter.season_year, entry.season_year) &&
        MatchesFilter(filter.season, entry.season)
    )
    .sort(CompareCompletedEntries);
  const grouped_entries = new Map<
    string,
    {
      group_key: string;
      label: string;
      entries: BookmarkCatalogEntry[];
    }
  >();

  for (const entry of filtered_entries) {
    const has_period = entry.season != null && entry.season_year != null;
    const group_key = has_period
      ? String(entry.season_year) + '-' + String(entry.season).toLowerCase()
      : 'unknown';
    const existing_group = grouped_entries.get(group_key);

    if (existing_group) {
      existing_group.entries.push(entry);
    } else {
      grouped_entries.set(group_key, {
        group_key,
        label: has_period
          ? FormatCompletedBookmarkReleasePeriod(entry)
          : UNKNOWN_RELEASE_PERIOD_LABEL,
        entries: [entry]
      });
    }
  }

  return Object.freeze({
    groups: Object.freeze(
      [...grouped_entries.values()].map(group =>
        Object.freeze({
          ...group,
          entries: Object.freeze(group.entries)
        })
      )
    ),
    filtered_count: filtered_entries.length,
    total_count: completed_entries.length,
    year_options: Object.freeze(
      year_options.map(option => Object.freeze(option))
    ),
    season_options: Object.freeze(
      season_options.map(option => Object.freeze(option))
    )
  });
}

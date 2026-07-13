import { TZDate } from '@date-fns/tz';

import type { AnimeSeasonSelection } from '@/features/anime-schedule';
import {
  ANIME_SEASONS,
  BANGKOK_TIME_ZONE,
  IsSupportedAnimeSeasonYear
} from '@/features/anime-schedule';

const MONTHS_PER_SEASON = 3;

export type AnimeSeasonSelectionResult =
  | {
      readonly is_valid: true;
      readonly selection: AnimeSeasonSelection;
      readonly needs_normalization: boolean;
    }
  | {
      readonly is_valid: false;
      readonly selection: null;
      readonly needs_normalization: false;
    };

export function GetCurrentAnimeSeason(now: Date): AnimeSeasonSelection {
  if (!Number.isFinite(now.getTime())) {
    throw new RangeError('Current time must be a valid date.');
  }

  const bangkok_date = new TZDate(now, BANGKOK_TIME_ZONE);

  return Object.freeze({
    season_year: bangkok_date.getFullYear(),
    season:
      ANIME_SEASONS[Math.floor(bangkok_date.getMonth() / MONTHS_PER_SEASON)]
  });
}

export function ParseAnimeSeasonYearInput(year_input: string): number | null {
  if (!/^[1-9][0-9]{0,3}$/.test(year_input)) return null;

  const season_year = Number(year_input);

  return IsSupportedAnimeSeasonYear(season_year) ? season_year : null;
}

export function ParseAnimeSeasonSelection(
  search_params: URLSearchParams,
  default_selection: AnimeSeasonSelection
): AnimeSeasonSelectionResult {
  const year_fields = search_params.getAll('season_year');
  const season_fields = search_params.getAll('season');
  const season_year =
    year_fields.length === 0
      ? default_selection.season_year
      : ParseAnimeSeasonYearInput(year_fields[0]);
  const season =
    season_fields.length === 0
      ? default_selection.season
      : ANIME_SEASONS.find(
          candidate => candidate.toLowerCase() === season_fields[0]
        );

  if (
    year_fields.length > 1 ||
    season_fields.length > 1 ||
    season_year === null ||
    season === undefined
  ) {
    return { is_valid: false, selection: null, needs_normalization: false };
  }

  return {
    is_valid: true,
    selection: Object.freeze({ season_year, season }),
    needs_normalization: year_fields.length === 0 || season_fields.length === 0
  };
}

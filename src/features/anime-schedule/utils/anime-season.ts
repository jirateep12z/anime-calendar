import {
  ANIME_SEASONS,
  MAXIMUM_ANIME_SEASON_YEAR,
  MINIMUM_ANIME_SEASON_YEAR
} from '../constants/anime-seasons';

import type { AnimeSeason } from '../types/anime-catalog';

export function NormalizeAnimeSeason(
  season: unknown
): AnimeSeason | null | undefined {
  if (season === null) return null;

  return ANIME_SEASONS.find(known_season => known_season === season);
}

export function NormalizeAnimeSeasonYear(
  season_year: unknown
): number | null | undefined {
  if (season_year === null) return null;

  return typeof season_year === 'number' &&
    Number.isSafeInteger(season_year) &&
    season_year > 0
    ? season_year
    : undefined;
}

export function IsSupportedAnimeSeasonYear(
  season_year: unknown
): season_year is number {
  return (
    typeof season_year === 'number' &&
    Number.isSafeInteger(season_year) &&
    season_year >= MINIMUM_ANIME_SEASON_YEAR &&
    season_year <= MAXIMUM_ANIME_SEASON_YEAR
  );
}

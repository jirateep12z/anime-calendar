import type { AnimeCatalogEntry, AnimeSeason } from './anime-catalog';

export interface AnimeSeasonSelection {
  readonly season_year: number;
  readonly season: AnimeSeason;
}

export interface AnimeSeasonRequest extends AnimeSeasonSelection {
  readonly page: number;
  readonly is_adult_content_visible: boolean;
}

export interface AnimeSeasonPage {
  readonly entries: readonly AnimeCatalogEntry[];
  readonly current_page: number;
  readonly has_next_page: boolean;
}

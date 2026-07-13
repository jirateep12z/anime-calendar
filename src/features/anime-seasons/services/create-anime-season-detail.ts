import type {
  AnimeCatalogEntry,
  AnimeDetailModel
} from '@/features/anime-schedule';
import { CreateAnimeDetailFromCatalog } from '@/features/anime-schedule';
import {
  SEASON_COPY,
  SEASON_LABELS,
  STATUS_LABELS
} from '../constants/season-copy';

export function CreateAnimeSeasonDetail(
  entry: AnimeCatalogEntry
): AnimeDetailModel {
  const catalog_detail = CreateAnimeDetailFromCatalog(entry, 0);
  const period_label =
    entry.season != null && entry.season_year != null
      ? `${SEASON_LABELS[entry.season]} ${entry.season_year}`
      : '—';

  return Object.freeze({
    ...catalog_detail,
    description: SEASON_COPY.DETAIL_DESCRIPTION,
    status_label:
      entry.media_status === null ? '—' : STATUS_LABELS[entry.media_status],
    episode_label:
      entry.total_episodes === null
        ? null
        : `${SEASON_COPY.EPISODES}: ${entry.total_episodes}`,
    rows: Object.freeze([
      ...catalog_detail.rows,
      [SEASON_COPY.SEASON, period_label] as const
    ])
  });
}

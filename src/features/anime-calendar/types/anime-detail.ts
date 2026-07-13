import type { BookmarkCatalogEntry } from '@/features/anime-notifications/types/notification';

export type AnimeDetailRow = readonly [label: string, value: string];

export interface AnimeDetailModel {
  readonly anilist_media_id: number;
  readonly title: string;
  readonly description: string;
  readonly cover_image_url: string | null;
  readonly format: string | null;
  readonly status_label: string | null;
  readonly episode_label: string | null;
  readonly is_adult: boolean;
  readonly rows: readonly AnimeDetailRow[];
  readonly body_description: string | null;
  readonly anilist_url: string | null;
  readonly bookmark_catalog_entry: BookmarkCatalogEntry;
}

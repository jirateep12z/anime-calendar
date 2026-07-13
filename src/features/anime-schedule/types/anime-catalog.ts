import type { ScheduleEntry, ScheduleTitle } from './schedule';

export type AnimeMediaStatus =
  'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS' | null;

export interface AnimeCatalogEntry {
  readonly anilist_media_id: number;
  readonly title: ScheduleTitle;
  readonly description: string | null;
  readonly cover_image_url: string | null;
  readonly format: string | null;
  readonly total_episodes: number | null;
  readonly duration_minutes: number | null;
  readonly media_status: AnimeMediaStatus;
  readonly is_adult: boolean;
  readonly genres: readonly string[];
  readonly average_score: number | null;
  readonly popularity: number | null;
  readonly anilist_url: string | null;
  readonly latest_schedule_entry: ScheduleEntry | null;
  readonly updated_at: number;
}

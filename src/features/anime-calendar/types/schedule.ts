export type AniListFormat = 'TV' | 'ONA';

export type BroadcastStatus = 'UPCOMING' | 'AIRING' | 'AIRED';

export type ScheduleViewMode = 'WEEKLY' | 'TIMELINE';

export interface ScheduleTitle {
  readonly primary: string;
  readonly english: string | null;
  readonly romaji: string | null;
  readonly native: string | null;
}

export interface ScheduleEntry {
  readonly public_id: string;
  readonly anilist_schedule_id: number;
  readonly anilist_media_id: number;
  readonly title: ScheduleTitle;
  readonly description: string | null;
  readonly cover_image_url: string | null;
  readonly episode_number: number;
  readonly total_episodes: number | null;
  readonly format: AniListFormat;
  readonly airing_at: number;
  readonly airing_date: string;
  readonly airing_time: string;
  readonly duration_minutes: number;
  readonly ends_at: number;
  readonly is_adult: boolean;
  readonly genres: readonly string[];
  readonly average_score: number | null;
  readonly popularity: number | null;
  readonly anilist_url: string | null;
}

export interface ScheduleInitialData {
  readonly range_start_date: string;
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly cached_at: number;
}

export interface ScheduleRange {
  readonly range_start: number;
  readonly range_end: number;
  readonly range_start_date: string;
  readonly range_end_date: string;
}

export interface ScheduleFilter {
  readonly statuses: readonly BroadcastStatus[];
  readonly formats: readonly AniListFormat[];
  readonly is_adult_content_visible: boolean;
  readonly is_aired_hidden: boolean;
}

export interface SchedulePreferences {
  readonly view_mode: ScheduleViewMode;
  readonly search_query: string;
  readonly selected_date: string | null;
  readonly filter: ScheduleFilter;
  readonly is_adult_confirmed: boolean;
}

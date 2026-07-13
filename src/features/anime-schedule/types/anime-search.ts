export interface AnimeSearchResult {
  readonly anilist_media_id: number;
  readonly title: {
    readonly primary: string;
    readonly english: string | null;
    readonly romaji: string | null;
    readonly native: string | null;
  };
  readonly cover_image_url: string | null;
  readonly format: string | null;
  readonly episode_count: number | null;
  readonly duration_minutes: number | null;
  readonly description: string | null;
  readonly genres: readonly string[];
  readonly average_score: number | null;
  readonly popularity: number | null;
  readonly is_adult: boolean;
  readonly anilist_url: string | null;
}

export interface AnimeSearchPage {
  readonly results: readonly AnimeSearchResult[];
  readonly has_next_page: boolean;
  readonly total_results: number | null;
}

'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import type {
  AnimeCatalogEntry,
  AnimeSeasonSelection
} from '@/features/anime-schedule';
import {
  AniListRequestError,
  FetchAniListSeasonPage
} from '@/features/anime-schedule/client';

const SEASON_CACHE_MILLISECONDS = 5 * 60 * 1000;

function CanRequest(error: Error | null): boolean {
  return !(
    error instanceof AniListRequestError &&
    error.retry_at_milliseconds !== null &&
    error.retry_at_milliseconds > Date.now()
  );
}

export function UseAnimeSeasonQuery(
  selection: AnimeSeasonSelection,
  is_adult_content_visible: boolean,
  is_online: boolean
) {
  const query = useInfiniteQuery({
    queryKey: [
      'anime-seasons',
      selection.season_year,
      selection.season,
      is_adult_content_visible
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam: page, signal }) =>
      FetchAniListSeasonPage(
        {
          ...selection,
          page,
          is_adult_content_visible
        },
        signal
      ),
    getNextPageParam: last_page =>
      last_page.has_next_page ? last_page.current_page + 1 : undefined,
    enabled: candidate => is_online && CanRequest(candidate.state.error),
    staleTime: SEASON_CACHE_MILLISECONDS,
    gcTime: SEASON_CACHE_MILLISECONDS,
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: candidate => CanRequest(candidate.state.error),
    refetchOnReconnect: candidate => CanRequest(candidate.state.error)
  });
  const entries_by_id = new Map<number, AnimeCatalogEntry>();

  for (const page of query.data?.pages ?? []) {
    for (const entry of page.entries) {
      if (
        (!entry.is_adult || is_adult_content_visible) &&
        !entries_by_id.has(entry.anilist_media_id)
      ) {
        entries_by_id.set(entry.anilist_media_id, entry);
      }
    }
  }

  return { ...query, entries: [...entries_by_id.values()] };
}

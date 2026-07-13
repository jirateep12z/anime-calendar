'use client';

import { useQuery } from '@tanstack/react-query';

import { FetchAniListAnimeSearch } from '../api/anilist-client';

const MINIMUM_SEARCH_QUERY_LENGTH = 2;
const SEARCH_STALE_TIME_MILLISECONDS = 5 * 60 * 1000;

export function UseAnimeSearchQuery(search_query: string) {
  const normalized_query = search_query.trim();
  const has_query = normalized_query.length >= MINIMUM_SEARCH_QUERY_LENGTH;
  const query = useQuery({
    queryKey: ['anime-search', normalized_query],
    enabled: has_query,
    retry: false,
    staleTime: SEARCH_STALE_TIME_MILLISECONDS,
    queryFn: ({ signal }) => FetchAniListAnimeSearch(normalized_query, signal)
  });

  return {
    results: query.data?.results ?? [],
    total_results: query.data?.total_results ?? null,
    has_query,
    is_searching: query.isFetching,
    has_error: query.isError,
    Refetch: query.refetch
  };
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { FetchAniListSchedule } from '../api/anilist-client';
import { AniListRequestError } from '../api/anilist-errors';
import {
  ReadLatestScheduleCache,
  ReadScheduleCache,
  WriteScheduleCache
} from '../cache/schedule-cache';
import { TransformAniListSchedules } from '../services/transform-schedule';

import type {
  ScheduleEntry,
  ScheduleInitialData,
  ScheduleRange
} from '../types/schedule';

const EMPTY_SCHEDULE_ENTRIES = Object.freeze([]) as readonly ScheduleEntry[];

interface ScheduleQueryData {
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly cached_at: number;
  readonly range: ScheduleRange;
}

function ReadBrowserCache(range: ScheduleRange, is_online: boolean) {
  if (typeof window === 'undefined') {
    return null;
  }

  const cache_result = ReadScheduleCache(range, window.localStorage);

  if (
    cache_result.cache_status === 'FRESH' ||
    cache_result.cache_status === 'STALE'
  ) {
    return cache_result;
  }

  if (!is_online) {
    const latest_cache = ReadLatestScheduleCache(window.localStorage);

    return latest_cache.cache_status === 'OFFLINE_FALLBACK'
      ? latest_cache
      : null;
  }

  return null;
}

export function UseScheduleQuery(
  range: ScheduleRange,
  initial_schedule_data: ScheduleInitialData | null,
  is_online: boolean
) {
  const initial_cache = useMemo(
    () => ReadBrowserCache(range, is_online),
    [is_online, range]
  );
  const has_matching_initial_data =
    initial_schedule_data?.range_start_date === range.range_start_date;
  const initial_cache_range =
    initial_cache !== null &&
    initial_cache.range_start !== null &&
    initial_cache.range_end !== null &&
    initial_cache.range_start_date !== null &&
    initial_cache.range_end_date !== null
      ? Object.freeze({
          range_start: initial_cache.range_start,
          range_end: initial_cache.range_end,
          range_start_date: initial_cache.range_start_date,
          range_end_date: initial_cache.range_end_date
        })
      : null;
  const initial_query_data: ScheduleQueryData | undefined = initial_cache
    ? Object.freeze({
        schedule_entries: initial_cache.schedule_entries,
        cached_at: initial_cache.cached_at ?? 0,
        range: initial_cache_range ?? range
      })
    : has_matching_initial_data && initial_schedule_data !== null
      ? Object.freeze({
          schedule_entries: initial_schedule_data.schedule_entries,
          cached_at: initial_schedule_data.cached_at,
          range
        })
      : undefined;

  const schedule_query = useQuery({
    queryKey: ['anime-calendar', range.range_start, range.range_end],
    initialData: initial_query_data,
    initialDataUpdatedAt: initial_query_data?.cached_at,
    refetchOnMount: 'always',
    retry: false,
    queryFn: async ({ signal }) => {
      const raw_schedules = await FetchAniListSchedule(range, signal);
      const schedule_entries = TransformAniListSchedules(raw_schedules);
      const cached_at = Date.now();

      if (typeof window !== 'undefined') {
        WriteScheduleCache(
          range,
          schedule_entries,
          cached_at,
          window.localStorage
        );
      }

      return Object.freeze({
        schedule_entries,
        cached_at,
        range
      });
    }
  });
  const has_data = schedule_query.data !== undefined;
  const is_network_unavailable =
    schedule_query.error instanceof AniListRequestError &&
    schedule_query.error.error_code === 'NETWORK';

  return Object.freeze({
    schedule_entries:
      schedule_query.data?.schedule_entries ?? EMPTY_SCHEDULE_ENTRIES,
    displayed_range: schedule_query.data?.range ?? range,
    is_initial_loading: schedule_query.isPending && !has_data,
    is_success: schedule_query.isSuccess,
    is_fetching: schedule_query.isFetching,
    has_refresh_error: schedule_query.isError && has_data,
    is_network_unavailable,
    has_initial_error: schedule_query.isError && !has_data,
    last_updated_at: has_data ? schedule_query.dataUpdatedAt : null,
    Refetch: schedule_query.refetch
  });
}

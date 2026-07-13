import { z } from 'zod';

import {
  SCHEDULE_CACHE_KEY,
  SCHEDULE_CACHE_MAX_AGE_MILLISECONDS,
  SCHEDULE_CACHE_SCHEMA_VERSION
} from '../constants/schedule';
import { ScheduleEntrySchema } from '../validation/schedule-entry-schema';

import type { ScheduleEntry, ScheduleRange } from '../types/schedule';

const ScheduleCacheSchema = z.object({
  schema_version: z.literal(SCHEDULE_CACHE_SCHEMA_VERSION),
  range_start: z.number().int().positive(),
  range_end: z.number().int().positive(),
  range_start_date: z.string().date(),
  range_end_date: z.string().date(),
  cached_at: z.number().int().nonnegative(),
  schedule_entries: z.array(ScheduleEntrySchema)
});

export type ScheduleCacheStatus =
  'MISSING' | 'FRESH' | 'STALE' | 'OFFLINE_FALLBACK' | 'INVALID';

export interface ScheduleCacheReadResult {
  readonly cache_status: ScheduleCacheStatus;
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly cached_at: number | null;
  readonly range_start: number | null;
  readonly range_end: number | null;
  readonly range_start_date: string | null;
  readonly range_end_date: string | null;
}

function CreateEmptyResult(
  cache_status: 'MISSING' | 'INVALID'
): ScheduleCacheReadResult {
  return Object.freeze({
    cache_status,
    schedule_entries: Object.freeze([]),
    cached_at: null,
    range_start: null,
    range_end: null,
    range_start_date: null,
    range_end_date: null
  });
}

function FreezeScheduleEntry(schedule_entry: ScheduleEntry): ScheduleEntry {
  return Object.freeze({
    ...schedule_entry,
    title: Object.freeze({ ...schedule_entry.title }),
    genres: Object.freeze([...schedule_entry.genres])
  });
}

export function RemoveScheduleCache(storage: Storage): void {
  try {
    storage.removeItem(SCHEDULE_CACHE_KEY);
  } catch {
    // Storage อาจถูกปิดกั้น แต่ memory state ของหน้าเว็บยังใช้งานต่อได้
  }
}

export function ReadScheduleCache(
  expected_range: ScheduleRange,
  storage: Storage
): ScheduleCacheReadResult {
  let serialized_cache: string | null;

  try {
    serialized_cache = storage.getItem(SCHEDULE_CACHE_KEY);
  } catch {
    return CreateEmptyResult('MISSING');
  }

  if (serialized_cache === null) {
    return CreateEmptyResult('MISSING');
  }

  let raw_cache: unknown;

  try {
    raw_cache = JSON.parse(serialized_cache) as unknown;
  } catch {
    RemoveScheduleCache(storage);

    return CreateEmptyResult('INVALID');
  }

  const parsed_cache = ScheduleCacheSchema.safeParse(raw_cache);

  if (!parsed_cache.success) {
    RemoveScheduleCache(storage);

    return CreateEmptyResult('INVALID');
  }

  if (
    parsed_cache.data.range_start !== expected_range.range_start ||
    parsed_cache.data.range_end !== expected_range.range_end
  ) {
    return CreateEmptyResult('MISSING');
  }

  const cache_age_milliseconds = Math.max(
    0,
    Date.now() - parsed_cache.data.cached_at
  );
  const cache_status =
    cache_age_milliseconds <= SCHEDULE_CACHE_MAX_AGE_MILLISECONDS
      ? 'FRESH'
      : 'STALE';

  return Object.freeze({
    cache_status,
    schedule_entries: Object.freeze(
      parsed_cache.data.schedule_entries.map(FreezeScheduleEntry)
    ),
    cached_at: parsed_cache.data.cached_at,
    range_start: parsed_cache.data.range_start,
    range_end: parsed_cache.data.range_end,
    range_start_date: parsed_cache.data.range_start_date,
    range_end_date: parsed_cache.data.range_end_date
  });
}

export function ReadLatestScheduleCache(
  storage: Storage
): ScheduleCacheReadResult {
  let serialized_cache: string | null;

  try {
    serialized_cache = storage.getItem(SCHEDULE_CACHE_KEY);
  } catch {
    return CreateEmptyResult('MISSING');
  }

  if (serialized_cache === null) {
    return CreateEmptyResult('MISSING');
  }

  let raw_cache: unknown;

  try {
    raw_cache = JSON.parse(serialized_cache) as unknown;
  } catch {
    RemoveScheduleCache(storage);

    return CreateEmptyResult('INVALID');
  }

  const parsed_cache = ScheduleCacheSchema.safeParse(raw_cache);

  if (!parsed_cache.success) {
    RemoveScheduleCache(storage);

    return CreateEmptyResult('INVALID');
  }

  return Object.freeze({
    cache_status: 'OFFLINE_FALLBACK',
    schedule_entries: Object.freeze(
      parsed_cache.data.schedule_entries.map(FreezeScheduleEntry)
    ),
    cached_at: parsed_cache.data.cached_at,
    range_start: parsed_cache.data.range_start,
    range_end: parsed_cache.data.range_end,
    range_start_date: parsed_cache.data.range_start_date,
    range_end_date: parsed_cache.data.range_end_date
  });
}

export function WriteScheduleCache(
  range: ScheduleRange,
  schedule_entries: readonly ScheduleEntry[],
  cached_at: number,
  storage: Storage
): boolean {
  const schedule_cache = {
    schema_version: SCHEDULE_CACHE_SCHEMA_VERSION,
    range_start: range.range_start,
    range_end: range.range_end,
    range_start_date: range.range_start_date,
    range_end_date: range.range_end_date,
    cached_at,
    schedule_entries
  };

  const parsed_cache = ScheduleCacheSchema.safeParse(schedule_cache);

  if (!parsed_cache.success) {
    return false;
  }

  try {
    storage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(parsed_cache.data));

    return true;
  } catch {
    return false;
  }
}

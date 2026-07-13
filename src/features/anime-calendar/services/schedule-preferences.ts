import { isMatch, isValid, parseISO } from 'date-fns';
import { z } from 'zod';

import {
  BROADCAST_STATUSES,
  DEFAULT_SCHEDULE_FILTER,
  DEFAULT_VIEW_MODE,
  SUPPORTED_FORMATS
} from '../constants/schedule';

import type {
  AniListFormat,
  BroadcastStatus,
  SchedulePreferences,
  ScheduleViewMode
} from '../types/schedule';

const StoredFilterSchema = z
  .object({
    statuses: z.array(z.enum(BROADCAST_STATUSES)).optional(),
    formats: z.array(z.enum(SUPPORTED_FORMATS)).optional(),
    is_adult_content_visible: z.boolean().optional(),
    is_aired_hidden: z.boolean().optional()
  })
  .optional();

const StoredPreferencesSchema = z.object({
  view_mode: z.enum(['WEEKLY', 'TIMELINE']).optional(),
  search_query: z.string().optional(),
  selected_date: z.string().nullable().optional(),
  filter: StoredFilterSchema,
  is_adult_confirmed: z.boolean().optional()
});

function ParseBooleanQuery(
  search_params: URLSearchParams,
  query_name: string,
  fallback_value: boolean
): boolean {
  const query_value = search_params.get(query_name);

  if (query_value === 'true') return true;
  if (query_value === 'false') return false;

  return fallback_value;
}

function ParseDate(candidate_date: string | null): string | null {
  if (
    candidate_date === null ||
    !isMatch(candidate_date, 'yyyy-MM-dd') ||
    !isValid(parseISO(candidate_date))
  ) {
    return null;
  }

  return candidate_date;
}

function ParseViewMode(
  query_value: string | null,
  fallback_value: ScheduleViewMode
): ScheduleViewMode {
  if (query_value === 'weekly') return 'WEEKLY';
  if (query_value === 'timeline') return 'TIMELINE';

  return fallback_value;
}

function ParseListQuery<ListValue extends string>(
  query_value: string | null,
  allowed_values: ReadonlyMap<string, ListValue>,
  fallback_values: readonly ListValue[]
): readonly ListValue[] {
  if (query_value === null || query_value.length === 0) {
    return fallback_values;
  }

  const query_parts = query_value.split(',');
  const parsed_values = query_parts.map(query_part =>
    allowed_values.get(query_part)
  );

  if (parsed_values.some(parsed_value => parsed_value === undefined)) {
    return fallback_values;
  }

  return Object.freeze([...new Set(parsed_values as ListValue[])]);
}

export function ParseSchedulePreferences(
  search_params: URLSearchParams,
  stored_value: unknown
): SchedulePreferences {
  const parsed_stored_value = StoredPreferencesSchema.safeParse(stored_value);
  const stored_preferences = parsed_stored_value.success
    ? parsed_stored_value.data
    : {};
  const stored_filter = stored_preferences.filter ?? {};
  const is_adult_confirmed = stored_preferences.is_adult_confirmed ?? false;
  const stored_adult_visibility =
    is_adult_confirmed &&
    (stored_filter.is_adult_content_visible ??
      DEFAULT_SCHEDULE_FILTER.is_adult_content_visible);
  const status_query_values = new Map<string, BroadcastStatus>([
    ['upcoming', 'UPCOMING'],
    ['airing', 'AIRING'],
    ['aired', 'AIRED']
  ]);
  const format_query_values = new Map<string, AniListFormat>([
    ['tv', 'TV'],
    ['ona', 'ONA']
  ]);
  const query_adult_visibility = ParseBooleanQuery(
    search_params,
    'adult',
    stored_adult_visibility
  );

  return Object.freeze({
    view_mode: ParseViewMode(
      search_params.get('view'),
      stored_preferences.view_mode ?? DEFAULT_VIEW_MODE
    ),
    search_query: search_params.has('q')
      ? (search_params.get('q') ?? '')
      : (stored_preferences.search_query ?? ''),
    selected_date: ParseDate(
      search_params.has('date')
        ? search_params.get('date')
        : (stored_preferences.selected_date ?? null)
    ),
    filter: Object.freeze({
      statuses: ParseListQuery(
        search_params.get('status'),
        status_query_values,
        stored_filter.statuses ?? BROADCAST_STATUSES
      ),
      formats: ParseListQuery(
        search_params.get('format'),
        format_query_values,
        stored_filter.formats ?? SUPPORTED_FORMATS
      ),
      is_adult_content_visible: is_adult_confirmed && query_adult_visibility,
      is_aired_hidden: ParseBooleanQuery(
        search_params,
        'hide_aired',
        stored_filter.is_aired_hidden ?? DEFAULT_SCHEDULE_FILTER.is_aired_hidden
      )
    }),
    is_adult_confirmed
  });
}

import {
  ADULT_CONFIRMATION_KEY,
  FILTER_PREFERENCE_KEY,
  VIEW_PREFERENCE_KEY
} from '../constants/calendar';

import type { SchedulePreferences } from '../types/calendar';

const SCHEDULE_PREFERENCE_QUERY_NAMES = Object.freeze([
  'view',
  'q',
  'status',
  'format',
  'adult',
  'hide_aired',
  'date'
]);

function ReadJsonValue(storage: Storage, storage_key: string): unknown {
  try {
    const serialized_value = storage.getItem(storage_key);

    return serialized_value === null
      ? null
      : (JSON.parse(serialized_value) as unknown);
  } catch {
    return null;
  }
}

function WriteJsonValue(
  storage: Storage,
  storage_key: string,
  stored_value: unknown
): boolean {
  try {
    storage.setItem(storage_key, JSON.stringify(stored_value));

    return true;
  } catch {
    return false;
  }
}

export function ReadStoredSchedulePreferences(storage: Storage): unknown {
  const view_preference = ReadJsonValue(storage, VIEW_PREFERENCE_KEY);
  const filter_preference = ReadJsonValue(storage, FILTER_PREFERENCE_KEY);
  const adult_confirmation = ReadJsonValue(storage, ADULT_CONFIRMATION_KEY);

  return {
    ...(typeof view_preference === 'object' && view_preference !== null
      ? view_preference
      : {}),
    ...(typeof filter_preference === 'object' && filter_preference !== null
      ? filter_preference
      : {}),
    ...(typeof adult_confirmation === 'object' && adult_confirmation !== null
      ? adult_confirmation
      : {})
  };
}

export function WriteStoredSchedulePreferences(
  storage: Storage,
  preferences: SchedulePreferences
): boolean {
  const is_view_written = WriteJsonValue(storage, VIEW_PREFERENCE_KEY, {
    view_mode: preferences.view_mode
  });
  const is_filter_written = WriteJsonValue(storage, FILTER_PREFERENCE_KEY, {
    search_query: preferences.search_query,
    selected_date: preferences.selected_date,
    filter: preferences.filter
  });
  const is_adult_written = WriteJsonValue(storage, ADULT_CONFIRMATION_KEY, {
    is_adult_confirmed: preferences.is_adult_confirmed
  });

  return is_view_written && is_filter_written && is_adult_written;
}

export function CreateUrlWithoutSchedulePreferences(source_url: URL): URL {
  const clean_url = new URL(source_url);

  for (const query_name of SCHEDULE_PREFERENCE_QUERY_NAMES) {
    clean_url.searchParams.delete(query_name);
  }

  return clean_url;
}

export function RemoveSchedulePreferencesFromUrl(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const clean_url = CreateUrlWithoutSchedulePreferences(
    new URL(window.location.href)
  );

  if (clean_url.href === window.location.href) {
    return;
  }

  window.history.replaceState({}, '', clean_url);
}

export function PersistSchedulePreferences(
  storage: Storage,
  preferences: SchedulePreferences
): boolean {
  const is_preferences_written = WriteStoredSchedulePreferences(
    storage,
    preferences
  );

  if (is_preferences_written) {
    RemoveSchedulePreferencesFromUrl();
  }

  return is_preferences_written;
}

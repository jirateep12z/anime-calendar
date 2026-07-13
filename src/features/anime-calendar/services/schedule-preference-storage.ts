import {
  ADULT_CONFIRMATION_KEY,
  FILTER_PREFERENCE_KEY,
  VIEW_PREFERENCE_KEY
} from '../constants/schedule';

import type { SchedulePreferences } from '../types/schedule';

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

export function WriteSchedulePreferencesToUrl(
  preferences: SchedulePreferences
): void {
  const preferences_url = new URL(window.location.href);
  const search_params = preferences_url.searchParams;

  search_params.set('view', preferences.view_mode.toLowerCase());
  if (preferences.search_query.length > 0) {
    search_params.set('q', preferences.search_query);
  } else {
    search_params.delete('q');
  }

  search_params.set(
    'status',
    preferences.filter.statuses.map(status => status.toLowerCase()).join(',')
  );
  search_params.set(
    'format',
    preferences.filter.formats.map(format => format.toLowerCase()).join(',')
  );
  search_params.set(
    'hide_aired',
    preferences.filter.is_aired_hidden.toString()
  );
  if (preferences.filter.is_adult_content_visible) {
    search_params.set('adult', 'true');
  } else {
    search_params.delete('adult');
  }

  if (preferences.selected_date !== null) {
    search_params.set('date', preferences.selected_date);
  } else {
    search_params.delete('date');
  }

  window.history.replaceState({}, '', preferences_url);
}

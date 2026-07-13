import { CalculateBroadcastStatus } from '../utils/schedule-time';

import type { ScheduleEntry, ScheduleFilter } from '../types/schedule';

function NormalizeSearchText(search_text: string): string {
  return search_text.trim().toLocaleLowerCase();
}

function MatchesSearch(
  schedule_entry: ScheduleEntry,
  normalized_search_query: string
): boolean {
  if (normalized_search_query.length === 0) {
    return true;
  }

  return [
    schedule_entry.title.english,
    schedule_entry.title.romaji,
    schedule_entry.title.native
  ].some(
    title =>
      title !== null &&
      title.toLocaleLowerCase().includes(normalized_search_query)
  );
}

export function FilterScheduleEntries(
  schedule_entries: readonly ScheduleEntry[],
  filter: ScheduleFilter,
  search_query: string,
  now_seconds: number
): readonly ScheduleEntry[] {
  const normalized_search_query = NormalizeSearchText(search_query);

  return Object.freeze(
    schedule_entries.filter(schedule_entry => {
      if (!filter.formats.includes(schedule_entry.format)) {
        return false;
      }

      if (!filter.is_adult_content_visible && schedule_entry.is_adult) {
        return false;
      }

      const broadcast_status = CalculateBroadcastStatus(
        schedule_entry,
        now_seconds
      );

      if (filter.is_aired_hidden && broadcast_status === 'AIRED') {
        return false;
      }

      if (!MatchesSearch(schedule_entry, normalized_search_query)) {
        return false;
      }

      return filter.statuses.includes(broadcast_status);
    })
  );
}

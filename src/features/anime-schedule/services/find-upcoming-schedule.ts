import { CalculateBroadcastStatus } from '../utils/schedule-time';

import type { ScheduleEntry } from '../types/schedule';

export function FindUpcomingScheduleEntries(
  schedule_entries: readonly ScheduleEntry[],
  now_seconds: number,
  is_adult_confirmed: boolean
): readonly ScheduleEntry[] {
  const visible_upcoming_entries = schedule_entries.filter(schedule_entry => {
    if (schedule_entry.is_adult && !is_adult_confirmed) {
      return false;
    }

    const broadcast_status = CalculateBroadcastStatus(
      schedule_entry,
      now_seconds
    );

    return broadcast_status === 'UPCOMING' || broadcast_status === 'AIRING';
  });

  const sorted_upcoming_entries = [...visible_upcoming_entries].sort(
    (left_entry, right_entry) => left_entry.airing_at - right_entry.airing_at
  );
  const nearest_airing_at = sorted_upcoming_entries[0]?.airing_at;

  if (nearest_airing_at === undefined) {
    return Object.freeze([]);
  }

  return Object.freeze(
    sorted_upcoming_entries.filter(
      schedule_entry => schedule_entry.airing_at === nearest_airing_at
    )
  );
}

export function FindUpcomingScheduleEntry(
  schedule_entries: readonly ScheduleEntry[],
  now_seconds: number,
  is_adult_confirmed: boolean
): ScheduleEntry | null {
  return (
    FindUpcomingScheduleEntries(
      schedule_entries,
      now_seconds,
      is_adult_confirmed
    )[0] ?? null
  );
}

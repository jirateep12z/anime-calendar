import type { ScheduleEntry } from '../types/schedule';

export function GroupScheduleEntries(
  schedule_entries: readonly ScheduleEntry[]
): ReadonlyMap<string, readonly ScheduleEntry[]> {
  const mutable_grouped_entries = new Map<string, ScheduleEntry[]>();

  schedule_entries.forEach(schedule_entry => {
    const date_entries =
      mutable_grouped_entries.get(schedule_entry.airing_date) ?? [];

    date_entries.push(schedule_entry);
    mutable_grouped_entries.set(schedule_entry.airing_date, date_entries);
  });

  const sorted_grouped_entries = [...mutable_grouped_entries.entries()]
    .sort(([left_date], [right_date]) => left_date.localeCompare(right_date))
    .map(
      ([airing_date, date_entries]) =>
        [
          airing_date,
          Object.freeze(
            [...date_entries].sort(
              (left_entry, right_entry) =>
                left_entry.airing_at - right_entry.airing_at
            )
          )
        ] as const
    );

  return new Map(sorted_grouped_entries);
}

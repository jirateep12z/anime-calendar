import { FetchAniListSchedule } from '../api/anilist-client';
import { CreateBangkokScheduleRange } from '../utils/schedule-time';
import { FindUpcomingScheduleEntry } from './find-upcoming-schedule';
import { TransformAniListSchedules } from './transform-schedule';

import type { ScheduleEntry } from '../types/schedule';

export async function FetchUpcomingScheduleEntry(
  now: Date,
  signal: AbortSignal
): Promise<ScheduleEntry | null> {
  const schedule_range = CreateBangkokScheduleRange(now);
  const raw_schedules = await FetchAniListSchedule(schedule_range, signal);
  const schedule_entries = TransformAniListSchedules(raw_schedules);
  const now_seconds = Math.floor(now.getTime() / 1000);

  return FindUpcomingScheduleEntry(schedule_entries, now_seconds, false);
}

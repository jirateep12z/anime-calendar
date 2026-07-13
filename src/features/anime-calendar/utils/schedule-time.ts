import { TZDate } from '@date-fns/tz';
import { addDays, format } from 'date-fns';

import { BANGKOK_TIME_ZONE } from '../constants/schedule';

import type {
  BroadcastStatus,
  ScheduleEntry,
  ScheduleRange
} from '../types/schedule';

function AssertValidDate(date: Date): void {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('วันที่ที่ใช้คำนวณช่วงตารางไม่ถูกต้อง');
  }
}

function CreateBangkokDate(timestamp_seconds: number): TZDate {
  if (!Number.isFinite(timestamp_seconds)) {
    throw new RangeError('Unix timestamp ต้องเป็นตัวเลขที่มีค่าจำกัด');
  }

  return new TZDate(timestamp_seconds * 1000, BANGKOK_TIME_ZONE);
}

export function CalculateBroadcastStatus(
  schedule_entry: Pick<ScheduleEntry, 'airing_at' | 'ends_at'>,
  now_seconds: number
): BroadcastStatus {
  if (now_seconds < schedule_entry.airing_at) {
    return 'UPCOMING';
  }

  if (now_seconds < schedule_entry.ends_at) {
    return 'AIRING';
  }

  return 'AIRED';
}

export function FormatBangkokDate(timestamp_seconds: number): string {
  return format(CreateBangkokDate(timestamp_seconds), 'yyyy-MM-dd');
}

export function FormatBangkokTime(timestamp_seconds: number): string {
  return format(CreateBangkokDate(timestamp_seconds), 'HH:mm');
}

export function CreateBangkokScheduleRange(now: Date): ScheduleRange {
  AssertValidDate(now);

  const bangkok_now = new TZDate(now, BANGKOK_TIME_ZONE);

  return CreateScheduleRangeFromBangkokDate(bangkok_now);
}

function CreateScheduleRangeFromBangkokDate(
  bangkok_date: TZDate
): ScheduleRange {
  const range_start_date = new TZDate(
    bangkok_date.getFullYear(),
    bangkok_date.getMonth(),
    bangkok_date.getDate(),
    BANGKOK_TIME_ZONE
  );
  const range_end_date = addDays(range_start_date, 6);
  const next_range_start_date = addDays(range_start_date, 7);

  return Object.freeze({
    range_start: Math.floor(range_start_date.getTime() / 1000),
    range_end: Math.floor(next_range_start_date.getTime() / 1000) - 1,
    range_start_date: format(range_start_date, 'yyyy-MM-dd'),
    range_end_date: format(range_end_date, 'yyyy-MM-dd')
  });
}

export function CreateBangkokScheduleRangeForDateKey(
  date_key: string
): ScheduleRange {
  const [year_text, month_text, day_text] = date_key.split('-');
  const bangkok_date = new TZDate(
    Number(year_text),
    Number(month_text) - 1,
    Number(day_text),
    BANGKOK_TIME_ZONE
  );

  AssertValidDate(bangkok_date);

  return CreateScheduleRangeFromBangkokDate(bangkok_date);
}

export function CreateScheduleDateKeys(
  range: ScheduleRange
): readonly string[] {
  const range_start_date = CreateBangkokDate(range.range_start);

  return Object.freeze(
    Array.from({ length: 7 }, (_, day_index) =>
      format(addDays(range_start_date, day_index), 'yyyy-MM-dd')
    )
  );
}

import { CalculateBroadcastStatus } from './schedule-time';

import type { ScheduleEntry } from '../types/schedule';

function FormatCountdownDuration(duration_seconds: number): string {
  const safe_duration_seconds = Math.max(0, Math.floor(duration_seconds));
  const days = Math.floor(safe_duration_seconds / 86_400);
  const hours = Math.floor((safe_duration_seconds % 86_400) / 3_600);
  const minutes = Math.floor((safe_duration_seconds % 3_600) / 60);
  const seconds = safe_duration_seconds % 60;

  return (
    [
      days > 0 ? `${days} วัน` : null,
      hours > 0 ? `${hours} ชั่วโมง` : null,
      minutes > 0 ? `${minutes} นาที` : null,
      seconds > 0 ? `${seconds} วินาที` : null
    ]
      .filter(
        (duration_part): duration_part is string => duration_part !== null
      )
      .join(' ') || 'น้อยกว่า 1 วินาที'
  );
}

export function FormatScheduleCountdownDuration(
  schedule_entry: Pick<ScheduleEntry, 'airing_at' | 'ends_at'>,
  now_seconds: number
): string {
  const broadcast_status = CalculateBroadcastStatus(
    schedule_entry,
    now_seconds
  );

  if (broadcast_status === 'UPCOMING') {
    return FormatCountdownDuration(schedule_entry.airing_at - now_seconds);
  }

  if (broadcast_status === 'AIRING') {
    return FormatCountdownDuration(schedule_entry.ends_at - now_seconds);
  }

  return 'ออกอากาศแล้ว';
}

export function FormatScheduleCountdown(
  schedule_entry: Pick<ScheduleEntry, 'airing_at' | 'ends_at'>,
  now_seconds: number
): string {
  const broadcast_status = CalculateBroadcastStatus(
    schedule_entry,
    now_seconds
  );

  if (broadcast_status === 'UPCOMING') {
    return `อีก ${FormatCountdownDuration(schedule_entry.airing_at - now_seconds)}`;
  }

  if (broadcast_status === 'AIRING') {
    return `เหลือ ${FormatCountdownDuration(schedule_entry.ends_at - now_seconds)}`;
  }

  return 'ออกอากาศแล้ว';
}

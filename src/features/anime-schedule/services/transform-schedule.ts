import {
  DEFAULT_DURATION_MINUTES,
  SUPPORTED_FORMATS
} from '../constants/schedule';
import { NormalizeHttpUrl } from '../utils/external-url';
import { FormatBangkokDate, FormatBangkokTime } from '../utils/schedule-time';
import {
  AniListAiringScheduleSchema,
  type AniListAiringSchedule,
  type AniListTitle
} from '../validation/anilist-schema';

import type { AniListFormat, ScheduleEntry } from '../types/schedule';

const FALLBACK_ANIME_TITLE = 'ไม่พบชื่ออนิเมะ';

export class ScheduleValidationError extends Error {
  public constructor() {
    super('ข้อมูลตารางออกอากาศทั้งหมดไม่ผ่านการตรวจสอบ');
    this.name = 'ScheduleValidationError';
  }
}

function IsSupportedFormat(format: string | null): format is AniListFormat {
  return SUPPORTED_FORMATS.some(
    supported_format => supported_format === format
  );
}

function NormalizeTitle(title: string | null): string | null {
  const normalized_title = title?.trim() ?? '';

  return normalized_title.length > 0 ? normalized_title : null;
}

function ResolveDurationMinutes(duration_minutes: number | null): number {
  return duration_minutes !== null && duration_minutes > 0
    ? duration_minutes
    : DEFAULT_DURATION_MINUTES;
}

function TransformSchedule(
  raw_schedule: AniListAiringSchedule,
  format: AniListFormat
): ScheduleEntry {
  const duration_minutes = ResolveDurationMinutes(
    raw_schedule.media.duration_minutes
  );
  const english_title = NormalizeTitle(raw_schedule.media.title.english);
  const romaji_title = NormalizeTitle(raw_schedule.media.title.romaji);
  const native_title = NormalizeTitle(raw_schedule.media.title.native);

  return Object.freeze({
    public_id: `schedule-${raw_schedule.id}`,
    anilist_schedule_id: raw_schedule.id,
    anilist_media_id: raw_schedule.media.id,
    title: Object.freeze({
      primary: SelectPrimaryTitle(raw_schedule.media.title),
      english: english_title,
      romaji: romaji_title,
      native: native_title
    }),
    description: raw_schedule.media.description?.trim() || null,
    cover_image_url: NormalizeHttpUrl(
      raw_schedule.media.cover_image?.large ?? null
    ),
    episode_number: raw_schedule.episode,
    total_episodes: raw_schedule.media.total_episodes,
    format,
    airing_at: raw_schedule.airing_at,
    airing_date: FormatBangkokDate(raw_schedule.airing_at),
    airing_time: FormatBangkokTime(raw_schedule.airing_at),
    duration_minutes,
    ends_at: raw_schedule.airing_at + duration_minutes * 60,
    is_adult: raw_schedule.media.is_adult,
    genres: Object.freeze([...raw_schedule.media.genres]),
    average_score: raw_schedule.media.average_score,
    popularity: raw_schedule.media.popularity,
    anilist_url: NormalizeHttpUrl(raw_schedule.media.site_url)
  });
}

export function SelectPrimaryTitle(title: AniListTitle): string {
  return (
    NormalizeTitle(title.english) ??
    NormalizeTitle(title.romaji) ??
    NormalizeTitle(title.native) ??
    FALLBACK_ANIME_TITLE
  );
}

export function TransformAniListSchedules(
  raw_schedules: readonly unknown[]
): readonly ScheduleEntry[] {
  const schedule_entry_by_id = new Map<number, ScheduleEntry>();
  let parsed_schedule_count = 0;

  raw_schedules.forEach(raw_schedule => {
    const parsed_schedule = AniListAiringScheduleSchema.safeParse(raw_schedule);

    if (!parsed_schedule.success) {
      return;
    }

    parsed_schedule_count += 1;
    const format = parsed_schedule.data.media.format;

    if (
      !IsSupportedFormat(format) ||
      schedule_entry_by_id.has(parsed_schedule.data.id)
    ) {
      return;
    }

    schedule_entry_by_id.set(
      parsed_schedule.data.id,
      TransformSchedule(parsed_schedule.data, format)
    );
  });

  if (raw_schedules.length > 0 && parsed_schedule_count === 0) {
    throw new ScheduleValidationError();
  }

  return Object.freeze(
    Array.from(schedule_entry_by_id.values()).sort(
      (left_entry, right_entry) => left_entry.airing_at - right_entry.airing_at
    )
  );
}

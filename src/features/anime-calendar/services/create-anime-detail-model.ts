import { CreateBookmarkCatalogEntryFromSchedule } from '@/features/anime-notifications/services/create-bookmark-catalog-entry';
import { FormatScheduleCountdown } from '../utils/countdown';
import { FormatScheduleDayLabel } from '../utils/schedule-date-label';

import type { BookmarkCatalogEntry } from '@/features/anime-notifications/types/notification';
import type { AnimeDetailModel, AnimeDetailRow } from '../types/anime-detail';
import type { ScheduleEntry } from '../types/schedule';

function CreateGeneralRows(
  catalog_entry: BookmarkCatalogEntry
): readonly AnimeDetailRow[] {
  return [
    ['English', catalog_entry.title.english ?? '—'],
    ['Romaji', catalog_entry.title.romaji ?? '—'],
    ['Native', catalog_entry.title.native ?? '—'],
    [
      'จำนวนตอน',
      catalog_entry.total_episodes !== null
        ? catalog_entry.total_episodes.toLocaleString('th-TH')
        : '—'
    ],
    [
      'ระยะเวลา',
      catalog_entry.duration_minutes !== null
        ? `${catalog_entry.duration_minutes} นาที`
        : '—'
    ],
    [
      'ประเภท',
      catalog_entry.genres.length > 0 ? catalog_entry.genres.join(', ') : '—'
    ],
    [
      'คะแนน',
      catalog_entry.average_score !== null
        ? `${catalog_entry.average_score}%`
        : '—'
    ],
    ['ความนิยม', catalog_entry.popularity?.toLocaleString('th-TH') ?? '—']
  ];
}

export function CreateAnimeDetailFromSchedule(
  schedule_entry: ScheduleEntry,
  now_seconds: number
): AnimeDetailModel {
  const catalog_entry = CreateBookmarkCatalogEntryFromSchedule(schedule_entry);
  const detail_rows: readonly AnimeDetailRow[] = [
    ['English', schedule_entry.title.english ?? '—'],
    ['Romaji', schedule_entry.title.romaji ?? '—'],
    ['Native', schedule_entry.title.native ?? '—'],
    [
      'วันและเวลา',
      `${FormatScheduleDayLabel(schedule_entry.airing_date)} ${schedule_entry.airing_time} น.`
    ],
    ['ระยะเวลา', `${schedule_entry.duration_minutes} นาที`],
    ['นับถอยหลัง', FormatScheduleCountdown(schedule_entry, now_seconds)],
    [
      'ประเภท',
      schedule_entry.genres.length > 0 ? schedule_entry.genres.join(', ') : '—'
    ],
    [
      'คะแนน',
      schedule_entry.average_score !== null
        ? `${schedule_entry.average_score}%`
        : '—'
    ],
    ['ความนิยม', schedule_entry.popularity?.toLocaleString('th-TH') ?? '—']
  ];

  return Object.freeze({
    anilist_media_id: schedule_entry.anilist_media_id,
    title: schedule_entry.title.primary,
    description: 'รายละเอียดกำหนดการออกอากาศตามเวลาไทย',
    cover_image_url: schedule_entry.cover_image_url,
    format: schedule_entry.format,
    status_label: null,
    episode_label: `ตอน ${schedule_entry.episode_number}`,
    is_adult: schedule_entry.is_adult,
    rows: Object.freeze(detail_rows),
    body_description: schedule_entry.description,
    anilist_url: schedule_entry.anilist_url,
    bookmark_catalog_entry: catalog_entry
  });
}

export function CreateAnimeDetailFromCatalog(
  catalog_entry: BookmarkCatalogEntry,
  now_seconds: number
): AnimeDetailModel {
  if (catalog_entry.latest_schedule_entry !== null) {
    const schedule_detail = CreateAnimeDetailFromSchedule(
      catalog_entry.latest_schedule_entry,
      now_seconds
    );

    return Object.freeze({
      ...schedule_detail,
      description: 'รายละเอียดอนิเมะที่บันทึกไว้บนอุปกรณ์นี้',
      status_label: catalog_entry.media_status === 'FINISHED' ? 'จบแล้ว' : null,
      bookmark_catalog_entry: catalog_entry
    });
  }

  return Object.freeze({
    anilist_media_id: catalog_entry.anilist_media_id,
    title: catalog_entry.title.primary,
    description: 'รายละเอียดอนิเมะที่บันทึกไว้บนอุปกรณ์นี้',
    cover_image_url: catalog_entry.cover_image_url,
    format: catalog_entry.format,
    status_label: catalog_entry.media_status === 'FINISHED' ? 'จบแล้ว' : null,
    episode_label: null,
    is_adult: catalog_entry.is_adult,
    rows: Object.freeze(CreateGeneralRows(catalog_entry)),
    body_description: catalog_entry.description,
    anilist_url: catalog_entry.anilist_url,
    bookmark_catalog_entry: catalog_entry
  });
}

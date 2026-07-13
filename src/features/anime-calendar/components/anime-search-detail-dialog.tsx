'use client';

import { Dialog } from '@/components/ui/dialog';
import { UseCalendarTime } from '../hooks/use-current-time';
import { FormatScheduleCountdown } from '../utils/countdown';
import { FormatScheduleDayLabel } from '../utils/schedule-date-label';
import {
  AnimeDetailDialogLayout,
  type AnimeDetailDialogRow
} from './anime-detail-dialog-layout';

import type { AnimeSearchResult } from '../types/anime-search';
import type { ScheduleEntry } from '../types/schedule';

interface AnimeSearchDetailDialogProps {
  readonly search_result: AnimeSearchResult | null;
  readonly is_adult_confirmed: boolean;
  readonly schedule_entry: ScheduleEntry | null;
  readonly HandleClose: () => void;
}

export function AnimeSearchDetailDialog({
  search_result,
  is_adult_confirmed,
  schedule_entry,
  HandleClose
}: AnimeSearchDetailDialogProps) {
  const now_seconds = UseCalendarTime();

  if (search_result === null) {
    return <Dialog open={false} />;
  }

  const is_hidden_adult_result = search_result.is_adult && !is_adult_confirmed;

  if (is_hidden_adult_result) {
    return <Dialog open={false} />;
  }

  const detail_rows: readonly AnimeDetailDialogRow[] = schedule_entry
    ? [
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
          schedule_entry.genres.length > 0
            ? schedule_entry.genres.join(', ')
            : '—'
        ],
        [
          'คะแนน',
          schedule_entry.average_score !== null
            ? `${schedule_entry.average_score}%`
            : '—'
        ],
        ['ความนิยม', schedule_entry.popularity?.toLocaleString('th-TH') ?? '—']
      ]
    : [
        ['English', search_result.title.english ?? '—'],
        ['Romaji', search_result.title.romaji ?? '—'],
        ['Native', search_result.title.native ?? '—'],
        ['วันและเวลา', 'ไม่มีข้อมูลกำหนดการ'],
        [
          'ระยะเวลา',
          search_result.duration_minutes !== null
            ? `${search_result.duration_minutes} นาที`
            : '—'
        ],
        ['นับถอยหลัง', '—'],
        [
          'ประเภท',
          search_result.genres.length > 0
            ? search_result.genres.join(', ')
            : '—'
        ],
        [
          'คะแนน',
          search_result.average_score !== null
            ? `${search_result.average_score}%`
            : '—'
        ],
        ['ความนิยม', search_result.popularity?.toLocaleString('th-TH') ?? '—']
      ];
  const display_title =
    schedule_entry?.title.primary ?? search_result.title.primary;

  return (
    <Dialog
      open
      onOpenChange={is_open => {
        if (!is_open) HandleClose();
      }}
    >
      <AnimeDetailDialogLayout
        anilist_media_id={
          schedule_entry?.anilist_media_id ?? search_result.anilist_media_id
        }
        title={display_title}
        description={
          schedule_entry
            ? 'รายละเอียดกำหนดการออกอากาศตามเวลาไทย'
            : 'รายละเอียดอนิเมะจาก AniList'
        }
        cover_image_url={
          schedule_entry?.cover_image_url ?? search_result.cover_image_url
        }
        format={schedule_entry?.format ?? search_result.format}
        episode_label={
          schedule_entry
            ? `ตอน ${schedule_entry.episode_number}`
            : search_result.episode_count !== null
              ? `ทั้งหมด ${search_result.episode_count} ตอน`
              : null
        }
        is_adult={schedule_entry?.is_adult ?? search_result.is_adult}
        rows={detail_rows}
        body_description={search_result.description}
        anilist_url={schedule_entry?.anilist_url ?? search_result.anilist_url}
      />
    </Dialog>
  );
}

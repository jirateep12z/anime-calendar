import type { ScheduleEntry } from '@/features/anime-calendar/types/schedule';
import type { BookmarkCatalogEntry } from '../types/notification';

export function CreateBookmarkCatalogEntryFromSchedule(
  schedule_entry: ScheduleEntry,
  updated_at: number = 0
): BookmarkCatalogEntry {
  return Object.freeze({
    anilist_media_id: schedule_entry.anilist_media_id,
    title: Object.freeze({ ...schedule_entry.title }),
    description: schedule_entry.description,
    cover_image_url: schedule_entry.cover_image_url,
    format: schedule_entry.format,
    total_episodes: schedule_entry.total_episodes,
    duration_minutes: schedule_entry.duration_minutes,
    media_status: null,
    is_adult: schedule_entry.is_adult,
    genres: Object.freeze([...schedule_entry.genres]),
    average_score: schedule_entry.average_score,
    popularity: schedule_entry.popularity,
    anilist_url: schedule_entry.anilist_url,
    latest_schedule_entry: Object.freeze(schedule_entry),
    updated_at
  });
}

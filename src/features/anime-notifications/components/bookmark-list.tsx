'use client';

import { FormatScheduleDayLabel } from '@/features/anime-calendar/utils/schedule-date-label';
import { UseNotifications } from '../hooks/use-notifications';
import { RemoveBookmarkWithUndo } from '../services/bookmark-removal';
import { BookmarkListItem } from './bookmark-list-item';

import type { ScheduleEntry } from '@/features/anime-calendar/types/schedule';
import type { BookmarkCatalogEntry } from '../types/notification';

interface BookmarkListProps {
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly HandleOpenDetail: (catalog_entry: BookmarkCatalogEntry) => void;
}

export function BookmarkList({
  schedule_entries,
  HandleOpenDetail
}: BookmarkListProps) {
  const state = UseNotifications();
  const is_adult_visible =
    state.preferences.is_adult_confirmed &&
    state.preferences.is_adult_content_visible;
  const schedule_by_media_id = new Map<number, ScheduleEntry>();

  [...schedule_entries]
    .sort((left, right) => left.airing_at - right.airing_at)
    .forEach(entry => {
      if (!schedule_by_media_id.has(entry.anilist_media_id)) {
        schedule_by_media_id.set(entry.anilist_media_id, entry);
      }
    });

  const dated_groups = new Map<
    string,
    { catalog: BookmarkCatalogEntry; schedule: ScheduleEntry }[]
  >();
  const outside_entries: BookmarkCatalogEntry[] = [];
  const missing_media_ids: number[] = [];
  let hidden_adult_count = 0;

  state.bookmarked_media_ids.forEach(media_id => {
    const catalog = state.bookmark_catalog_entries.get(media_id);

    if (!catalog) return missing_media_ids.push(media_id);
    if (catalog.is_adult && !is_adult_visible) {
      hidden_adult_count += 1;

      return;
    }

    const schedule = schedule_by_media_id.get(media_id);

    if (!schedule) return outside_entries.push(catalog);
    const group = dated_groups.get(schedule.airing_date) ?? [];

    group.push({ catalog, schedule });
    dated_groups.set(schedule.airing_date, group);
  });
  const ordered_groups = [...dated_groups.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  outside_entries.sort((a, b) =>
    a.title.primary.localeCompare(b.title.primary, 'th')
  );
  const HandleRemove = (entry: BookmarkCatalogEntry) =>
    RemoveBookmarkWithUndo(entry, state.ToggleBookmark);

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="bookmark-list-title"
    >
      <h3 id="bookmark-list-title" className="text-sm font-medium">
        รายการบุ๊กมาร์ก
      </h3>
      {ordered_groups.map(([date, entries]) => (
        <div className="flex flex-col gap-2" key={date}>
          <h4 className="text-muted-foreground border-b pb-1 text-xs font-medium">
            {FormatScheduleDayLabel(date)}
          </h4>
          <ul className="flex flex-col gap-2">
            {entries
              .sort((a, b) => a.schedule.airing_at - b.schedule.airing_at)
              .map(({ catalog, schedule }) => (
                <BookmarkListItem
                  key={catalog.anilist_media_id}
                  catalog_entry={catalog}
                  schedule_entry={schedule}
                  is_pending={state.pending_media_ids.has(
                    catalog.anilist_media_id
                  )}
                  HandleOpen={HandleOpenDetail}
                  HandleRemove={HandleRemove}
                />
              ))}
          </ul>
        </div>
      ))}
      {outside_entries.length > 0 || missing_media_ids.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h4 className="text-muted-foreground border-b pb-1 text-xs font-medium">
            นอกตาราง 7 วัน
          </h4>
          <ul className="flex flex-col gap-2">
            {outside_entries.map(catalog => (
              <BookmarkListItem
                key={catalog.anilist_media_id}
                catalog_entry={catalog}
                is_pending={state.pending_media_ids.has(
                  catalog.anilist_media_id
                )}
                HandleOpen={HandleOpenDetail}
                HandleRemove={HandleRemove}
              />
            ))}
            {missing_media_ids.map(media_id => (
              <li
                key={media_id}
                className="text-muted-foreground rounded-lg border p-3 text-sm"
              >
                Anime #{media_id} · กำลังโหลดข้อมูล
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {state.bookmarked_media_ids.size === 0 ? (
        <p className="text-muted-foreground text-sm">
          ยังไม่มีบุ๊กมาร์ก เลือกเรื่องที่ชอบจากตารางเพื่อเพิ่มรายการ
        </p>
      ) : null}
      {hidden_adult_count > 0 ? (
        <p className="text-muted-foreground text-xs">
          ซ่อนรายการ 18+ จำนวน {hidden_adult_count.toLocaleString('th-TH')}{' '}
          เรื่อง
        </p>
      ) : null}
      {state.is_catalog_refreshing ? (
        <p className="text-muted-foreground text-xs">กำลังอัปเดตข้อมูล…</p>
      ) : null}
      {state.catalog_error_message ? (
        <p role="status" className="text-muted-foreground text-xs">
          อัปเดตข้อมูลล่าสุดไม่ได้ กำลังแสดงข้อมูลที่บันทึกไว้
        </p>
      ) : null}
    </section>
  );
}

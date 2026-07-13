'use client';

import { button_variants } from '@/components/ui/button-variants';
import { FormatScheduleDayLabel } from '@/features/anime-schedule';
import { UseBookmarks } from '../hooks/use-bookmarks';
import { RemoveBookmarkWithUndo } from '../services/bookmark-removal';
import { PartitionBookmarks } from '../services/partition-bookmarks';
import { BookmarkListItem } from './bookmark-list-item';

import type { ScheduleEntry } from '@/features/anime-schedule';
import type { BookmarkCatalogEntry } from '../types/bookmark';

interface BookmarkListProps {
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly is_adult_content_visible: boolean;
  readonly HandleOpenDetail: (catalog_entry: BookmarkCatalogEntry) => void;
}

export function BookmarkList({
  schedule_entries,
  is_adult_content_visible,
  HandleOpenDetail
}: BookmarkListProps) {
  const state = UseBookmarks();
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
  const {
    main_entries,
    completed_entries,
    missing_media_ids,
    hidden_adult_count
  } = PartitionBookmarks(
    state.bookmarked_media_ids,
    state.bookmark_catalog_entries,
    is_adult_content_visible
  );

  main_entries.forEach(catalog => {
    const schedule = schedule_by_media_id.get(catalog.anilist_media_id);

    if (!schedule) {
      outside_entries.push(catalog);

      return;
    }

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
      <a
        href="/calendar/completed"
        className={button_variants({ variant: 'outline' })}
      >
        {state.is_hydrated
          ? 'ดูเรื่องที่จบแล้ว (' +
            completed_entries.length.toLocaleString('th-TH') +
            ')'
          : 'ดูเรื่องที่จบแล้ว'}
      </a>
      {!state.is_hydrated ? (
        <p role="status" className="text-muted-foreground text-sm">
          กำลังโหลดบุ๊กมาร์ก…
        </p>
      ) : (
        <>
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
          {main_entries.length === 0 &&
          missing_media_ids.length === 0 &&
          completed_entries.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              เรื่องที่จบแล้วอยู่ในหน้าแยก เปิดดูได้จากปุ่มด้านบน
            </p>
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
        </>
      )}
    </section>
  );
}

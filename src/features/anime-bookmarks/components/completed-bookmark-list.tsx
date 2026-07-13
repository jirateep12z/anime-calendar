'use client';

import { useRef, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/components/ui/empty';
import { DEFAULT_COMPLETED_BOOKMARK_FILTER } from '../constants/completed-bookmarks';
import { UseBookmarks } from '../hooks/use-bookmarks';
import { RemoveBookmarkWithUndo } from '../services/bookmark-removal';
import { BuildCompletedBookmarkView } from '../services/completed-bookmark-view';
import { PartitionBookmarks } from '../services/partition-bookmarks';
import { CompletedBookmarkCard } from './completed-bookmark-card';
import { CompletedBookmarkToolbar } from './completed-bookmark-toolbar';

import type { BookmarkCatalogEntry } from '../types/bookmark';

interface CompletedBookmarkListProps {
  readonly is_adult_content_visible: boolean;
  readonly HandleOpenDetail: (catalog_entry: BookmarkCatalogEntry) => void;
}

export function CompletedBookmarkList({
  is_adult_content_visible,
  HandleOpenDetail
}: CompletedBookmarkListProps) {
  const state = UseBookmarks();
  const heading_ref = useRef<HTMLHeadingElement>(null);
  const [filter, set_filter] = useState(DEFAULT_COMPLETED_BOOKMARK_FILTER);
  const [is_retrying, set_is_retrying] = useState(false);
  const [has_retry_failed, set_has_retry_failed] = useState(false);
  const { completed_entries, missing_media_ids } = PartitionBookmarks(
    state.bookmarked_media_ids,
    state.bookmark_catalog_entries,
    is_adult_content_visible
  );
  const view = BuildCompletedBookmarkView(completed_entries, filter);
  const has_active_filters =
    filter.season_year !== 'ALL' || filter.season !== 'ALL';
  const has_sync_error = state.sync_error_message !== null || has_retry_failed;
  const has_incomplete_results =
    has_sync_error ||
    missing_media_ids.length > 0 ||
    state.catalog_error_message !== null;

  const HandleRemove = (entry: BookmarkCatalogEntry) => {
    heading_ref.current?.focus();
    RemoveBookmarkWithUndo(entry, state.ToggleBookmark);
  };
  const HandleClearFilters = () => {
    heading_ref.current?.focus();
    set_filter(DEFAULT_COMPLETED_BOOKMARK_FILTER);
  };
  const HandleRetry = async () => {
    set_is_retrying(true);
    set_has_retry_failed(false);

    try {
      await state.RetryPendingMutations();
    } catch {
      set_has_retry_failed(true);
    } finally {
      set_is_retrying(false);
    }
  };
  const retry_button = (
    <Button
      type="button"
      variant="outline"
      className="shrink-0"
      disabled={is_retrying}
      aria-busy={is_retrying}
      onClick={() => void HandleRetry()}
    >
      {is_retrying ? 'กำลังลองอีกครั้ง…' : 'ลองอีกครั้ง'}
    </Button>
  );

  return (
    <section
      className="flex flex-col gap-4"
      aria-labelledby="completed-bookmark-list-title"
    >
      {state.is_hydrated ? (
        <CompletedBookmarkToolbar
          filter={filter}
          year_options={view.year_options}
          season_options={view.season_options}
          HandleFilterChange={set_filter}
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="completed-bookmark-list-title"
          ref={heading_ref}
          tabIndex={-1}
          className="focus:ring-ring rounded-sm text-xl font-semibold focus:ring-3 focus:outline-none"
        >
          {'รายการจบแล้ว'}
        </h2>
        {state.is_hydrated &&
        (view.total_count > 0 || !has_incomplete_results) ? (
          <Badge
            variant="secondary"
            role="status"
            aria-label={'จำนวนเรื่องที่แสดง'}
          >
            {'แสดง ' +
              view.filtered_count.toLocaleString('th-TH') +
              ' จาก ' +
              view.total_count.toLocaleString('th-TH') +
              ' เรื่องที่มีข้อมูล'}
          </Badge>
        ) : null}
      </div>
      {!state.is_hydrated ? (
        <p role="status" className="text-muted-foreground text-sm">
          {'กำลังโหลดบุ๊กมาร์ก…'}
        </p>
      ) : (
        <>
          {view.groups.length > 0 ? (
            view.groups.map(group => (
              <section
                key={group.group_key}
                className="flex flex-col gap-3"
                aria-labelledby={'completed-bookmark-group-' + group.group_key}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3
                    id={'completed-bookmark-group-' + group.group_key}
                    className="text-lg font-semibold"
                  >
                    {group.label}
                  </h3>
                  <Badge variant="secondary">
                    {group.entries.length.toLocaleString('th-TH') + ' เรื่อง'}
                  </Badge>
                </div>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.entries.map(catalog_entry => (
                    <CompletedBookmarkCard
                      key={catalog_entry.anilist_media_id}
                      catalog_entry={catalog_entry}
                      is_pending={state.pending_media_ids.has(
                        catalog_entry.anilist_media_id
                      )}
                      HandleOpen={HandleOpenDetail}
                      HandleRemove={HandleRemove}
                    />
                  ))}
                </ul>
              </section>
            ))
          ) : has_active_filters &&
            (view.total_count > 0 || !has_incomplete_results) ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{'ไม่พบเรื่องที่ตรงกับตัวกรอง'}</EmptyTitle>
                <EmptyDescription>
                  {'ลองเลือกปีหรือฤดูกาลอื่น หรือแสดงรายการทั้งหมด'}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  onClick={HandleClearFilters}
                >
                  {'แสดงทั้งหมด'}
                </Button>
              </EmptyContent>
            </Empty>
          ) : !has_incomplete_results ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>
                  {'ยังไม่มีเรื่องที่จบแล้วที่แสดงได้ตามการตั้งค่าปัจจุบัน'}
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : null}
          {has_sync_error ? (
            <Alert role="status">
              <AlertTitle>{'ยังยืนยันรายการไม่ได้'}</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <p>{'รายการอาจยังไม่ครบ เพราะซิงก์บุ๊กมาร์กไม่สำเร็จ'}</p>
                {retry_button}
              </AlertDescription>
            </Alert>
          ) : null}
          {missing_media_ids.length > 0 && !has_sync_error ? (
            <p role="status" className="text-muted-foreground text-sm">
              {
                'ยังจำแนกบุ๊กมาร์กบางเรื่องไม่ได้ เชื่อมต่ออินเทอร์เน็ตแล้วเปิดหน้านี้ใหม่เพื่ออัปเดตข้อมูล'
              }
            </p>
          ) : null}
          {state.is_catalog_refreshing ? (
            <p role="status" className="text-muted-foreground text-sm">
              {'กำลังอัปเดตข้อมูล…'}
            </p>
          ) : null}
          {state.catalog_error_message ? (
            <p role="status" className="text-muted-foreground text-sm">
              {'อัปเดตข้อมูลล่าสุดไม่ได้ รายการนี้อาจยังไม่ครบ'}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

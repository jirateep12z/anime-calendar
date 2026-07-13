'use client';

import { SearchIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { UseAnimeSearchQuery } from '../hooks/use-anime-search-query';
import { UseDebouncedValue } from '../hooks/use-debounced-value';
import type { AnimeSearchResult } from '../types/anime-search';
import type { ScheduleEntry } from '../types/schedule';
import { AnimeSearchDetailDialog } from './anime-search-detail-dialog';
import { AnimeSearchResultCard } from './anime-search-result-card';
import { ScheduleCard } from './schedule-card';

interface ScheduleSearchDialogProps {
  readonly is_adult_confirmed: boolean;
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly selected_date: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly HandleOpenScheduleEntry: (schedule_entry: ScheduleEntry) => void;
}

export function ScheduleSearchDialog({
  is_adult_confirmed,
  schedule_entries,
  selected_date,
  open,
  onOpenChange,
  HandleOpenScheduleEntry
}: ScheduleSearchDialogProps) {
  const [selected_search_result, set_selected_search_result] =
    useState<AnimeSearchResult | null>(null);
  const [selected_schedule_entry, set_selected_schedule_entry] =
    useState<ScheduleEntry | null>(null);
  const [draft_search_query, set_draft_search_query] = useState('');
  const debounced_search_query = UseDebouncedValue(draft_search_query, 300);
  const search_query = UseAnimeSearchQuery(debounced_search_query);
  const selected_date_entries = useMemo(
    () =>
      schedule_entries.filter(
        schedule_entry =>
          schedule_entry.airing_date === selected_date &&
          (is_adult_confirmed || !schedule_entry.is_adult)
      ),
    [is_adult_confirmed, schedule_entries, selected_date]
  );
  const visible_results = useMemo(
    () =>
      search_query.results.filter(
        search_result => is_adult_confirmed || !search_result.is_adult
      ),
    [is_adult_confirmed, search_query.results]
  );
  const HandleOpenSearchResult = (search_result: AnimeSearchResult) => {
    set_selected_search_result(search_result);
    set_selected_schedule_entry(
      schedule_entries.find(
        schedule_entry =>
          schedule_entry.anilist_media_id === search_result.anilist_media_id
      ) ?? null
    );
    onOpenChange(false);
  };

  const HandleCloseSearchDetail = () => {
    set_selected_search_result(null);
    set_selected_schedule_entry(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>ค้นหาอนิเมะ</DialogTitle>
          <DialogDescription>
            ค้นหาจากคลัง AniList โดยไม่เปลี่ยนผลลัพธ์ในตารางออกอากาศ
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-4">
          <div className="relative">
            <SearchIcon
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={draft_search_query}
              placeholder="ค้นหาชื่อ English, Romaji หรือ Native"
              aria-label="ค้นหาอนิเมะใน AniList"
              className="h-11 pr-10 pl-9"
              autoFocus
              onChange={event => set_draft_search_query(event.target.value)}
            />
            {draft_search_query.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 right-2 -translate-y-1/2"
                aria-label="ล้างคำค้นหา"
                onClick={() => set_draft_search_query('')}
              >
                <XIcon aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          <div className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
            {draft_search_query.trim().length === 0 ? (
              selected_date_entries.length > 0 ? (
                <div className="grid gap-3">
                  {selected_date_entries.map(schedule_entry => (
                    <ScheduleCard
                      key={schedule_entry.public_id}
                      schedule_entry={schedule_entry}
                      HandleOpen={schedule_entry_to_open => {
                        onOpenChange(false);
                        HandleOpenScheduleEntry(schedule_entry_to_open);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  วันนี้ไม่มีรายการออกอากาศ
                </p>
              )
            ) : !search_query.has_query ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา
              </p>
            ) : search_query.is_searching ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
                <Spinner aria-hidden="true" /> กำลังค้นหา AniList…
              </div>
            ) : search_query.has_error ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-destructive text-sm">
                  ค้นหา AniList ไม่สำเร็จ
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void search_query.Refetch()}
                >
                  ลองใหม่
                </Button>
              </div>
            ) : visible_results.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                ไม่พบอนิเมะที่ตรงกับคำค้นหา
              </p>
            ) : (
              <>
                <p className="text-muted-foreground text-xs">
                  พบ {search_query.total_results ?? visible_results.length}{' '}
                  รายการ
                </p>
                {visible_results.map(search_result => (
                  <AnimeSearchResultCard
                    key={search_result.anilist_media_id}
                    search_result={search_result}
                    HandleOpen={HandleOpenSearchResult}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </DialogContent>
      <AnimeSearchDetailDialog
        search_result={selected_search_result}
        is_adult_confirmed={is_adult_confirmed}
        schedule_entry={selected_schedule_entry}
        HandleClose={HandleCloseSearchDetail}
      />
    </Dialog>
  );
}

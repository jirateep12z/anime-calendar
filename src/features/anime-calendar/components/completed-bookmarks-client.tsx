'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  BookmarkButton,
  CompletedBookmarkList,
  UseBookmarks
} from '@/features/anime-bookmarks/client';
import { UseNotifications } from '@/features/anime-notifications/client';
import { CreateAnimeDetailFromCatalog } from '@/features/anime-schedule';
import { AnimeDetailDialog } from '@/features/anime-schedule/client';
import { FinishAppLoading } from '@/features/app-loading';

import type { BookmarkCatalogEntry } from '@/features/anime-bookmarks';
import type { AnimeDetailModel } from '@/features/anime-schedule';

const MILLISECONDS_PER_SECOND = 1_000;

export function CompletedBookmarksClient() {
  const { is_hydrated } = UseBookmarks();
  const { preferences } = UseNotifications();
  const [selected_detail_model, set_selected_detail_model] =
    useState<AnimeDetailModel | null>(null);
  const is_adult_content_visible =
    preferences.is_adult_confirmed && preferences.is_adult_content_visible;
  const is_selected_detail_adult =
    selected_detail_model?.is_adult === true ||
    selected_detail_model?.catalog_entry.is_adult === true;
  const visible_detail_model =
    is_selected_detail_adult && !is_adult_content_visible
      ? null
      : selected_detail_model;

  useEffect(() => {
    if (is_hydrated) {
      FinishAppLoading();
    }
  }, [is_hydrated]);

  const HandleOpenDetail = (catalog_entry: BookmarkCatalogEntry) => {
    if (catalog_entry.is_adult && !is_adult_content_visible) {
      return;
    }

    set_selected_detail_model(
      CreateAnimeDetailFromCatalog(
        catalog_entry,
        Math.floor(Date.now() / MILLISECONDS_PER_SECOND)
      )
    );
  };

  return (
    <main className="bg-background mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col items-start gap-3">
        <Button asChild variant="ghost">
          <Link href="/calendar" prefetch={false}>
            กลับไปตารางอนิเมะ
          </Link>
        </Button>
        <h1
          id="completed-bookmarks-title"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
        >
          เรื่องที่จบแล้ว
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          แสดงเรื่องที่ AniList ระบุว่าจบการออกอากาศและยังอยู่ในบุ๊กมาร์ก
        </p>
      </header>
      <CompletedBookmarkList
        is_adult_content_visible={is_adult_content_visible}
        HandleOpenDetail={HandleOpenDetail}
      />
      <AnimeDetailDialog
        detail_model={visible_detail_model}
        actions={
          visible_detail_model ? (
            <BookmarkButton
              anilist_media_id={visible_detail_model.anilist_media_id}
              title={visible_detail_model.title}
              catalog_entry={visible_detail_model.catalog_entry}
            />
          ) : null
        }
        HandleClose={() => set_selected_detail_model(null)}
      />
    </main>
  );
}

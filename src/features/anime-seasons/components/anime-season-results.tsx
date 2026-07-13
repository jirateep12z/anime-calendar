'use client';

import { useEffect, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookmarkButton,
  UseBookmarks
} from '@/features/anime-bookmarks/client';
import {
  AniListRequestError,
  AnimeDetailDialog
} from '@/features/anime-schedule/client';
import { SEASON_COPY } from '../constants/season-copy';
import { UseAnimeSeasonQuery } from '../hooks/use-anime-season-query';
import { UseRetryAvailability } from '../hooks/use-retry-availability';
import { CreateAnimeSeasonDetail } from '../services/create-anime-season-detail';
import { AnimeSeasonCard } from './anime-season-card';

import type {
  AnimeCatalogEntry,
  AnimeSeasonSelection
} from '@/features/anime-schedule';

interface AnimeSeasonResultsProps {
  readonly selection: AnimeSeasonSelection;
  readonly is_adult_content_visible: boolean;
  readonly is_online: boolean;
}

export function AnimeSeasonResults({
  selection,
  is_adult_content_visible,
  is_online
}: AnimeSeasonResultsProps) {
  const query = UseAnimeSeasonQuery(
    selection,
    is_adult_content_visible,
    is_online
  );
  const { is_hydrated, pending_media_ids } = UseBookmarks();
  const [selected_entry, set_selected_entry] =
    useState<AnimeCatalogEntry | null>(null);
  const [has_action_error, set_has_action_error] = useState(false);
  const trigger_ref = useRef<HTMLButtonElement | null>(null);
  const restore_frame_ref = useRef<number | null>(null);
  const retry_at_milliseconds =
    query.error instanceof AniListRequestError
      ? query.error.retry_at_milliseconds
      : null;
  const is_retry_available = UseRetryAvailability(retry_at_milliseconds);
  const is_rate_limited =
    query.error instanceof AniListRequestError &&
    query.error.error_code === 'RATE_LIMIT';
  const visible_selected_entry =
    selected_entry !== null &&
    (!selected_entry.is_adult || is_adult_content_visible)
      ? selected_entry
      : null;
  const detail_model =
    visible_selected_entry === null
      ? null
      : CreateAnimeSeasonDetail(visible_selected_entry);
  const error_message = is_rate_limited
    ? SEASON_COPY.RATE_LIMIT
    : query.isFetchNextPageError
      ? SEASON_COPY.NEXT_ERROR
      : query.data !== undefined
        ? SEASON_COPY.REFRESH_ERROR
        : SEASON_COPY.ERROR;
  const are_requests_disabled =
    !is_online || query.isFetching || !is_retry_available;

  useEffect(
    () => () => {
      if (restore_frame_ref.current !== null)
        cancelAnimationFrame(restore_frame_ref.current);
    },
    []
  );

  function HandleOpen(entry: AnimeCatalogEntry, trigger: HTMLButtonElement) {
    if (entry.is_adult && !is_adult_content_visible) return;
    trigger_ref.current = trigger;
    set_selected_entry(entry);
  }

  function HandleClose() {
    set_selected_entry(null);
    if (restore_frame_ref.current !== null)
      cancelAnimationFrame(restore_frame_ref.current);
    const trigger = trigger_ref.current;

    restore_frame_ref.current = requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
    });
  }

  function HandleRequest(is_next_page: boolean) {
    if (
      are_requests_disabled ||
      (retry_at_milliseconds !== null && retry_at_milliseconds > Date.now())
    )
      return;

    set_has_action_error(false);
    const request = is_next_page
      ? query.fetchNextPage({ cancelRefetch: false, throwOnError: false })
      : query.refetch({ cancelRefetch: false, throwOnError: false });

    void request.catch(() => set_has_action_error(true));
  }

  function RenderBookmark(entry: AnimeCatalogEntry) {
    return (
      <fieldset disabled={!is_hydrated} className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">{entry.title.primary}</legend>
        <BookmarkButton
          anilist_media_id={entry.anilist_media_id}
          title={entry.title.primary}
          catalog_entry={entry}
        />
      </fieldset>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!is_online ? (
        <Alert>
          <AlertDescription>{SEASON_COPY.OFFLINE}</AlertDescription>
        </Alert>
      ) : null}
      {query.isError || has_action_error ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col items-start gap-3">
            <p>{has_action_error ? SEASON_COPY.ERROR : error_message}</p>
            <Button
              type="button"
              variant="outline"
              disabled={are_requests_disabled}
              onClick={() => HandleRequest(query.isFetchNextPageError)}
            >
              {SEASON_COPY.RETRY}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <p role="status" className="text-muted-foreground text-sm">
        {query.isFetching
          ? SEASON_COPY.LOADING
          : `${SEASON_COPY.LOADED} ${query.entries.length} ${SEASON_COPY.TITLES}`}
      </p>
      {query.isPending && is_online ? (
        <div
          aria-hidden="true"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-52 motion-reduce:animate-none" />
          ))}
        </div>
      ) : null}
      {query.isSuccess && query.entries.length === 0 && !query.hasNextPage ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{SEASON_COPY.EMPTY}</EmptyTitle>
            <EmptyDescription>{SEASON_COPY.EMPTY_DESCRIPTION}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {query.entries.map(entry => (
          <AnimeSeasonCard
            key={entry.anilist_media_id}
            entry={entry}
            is_pending={pending_media_ids.has(entry.anilist_media_id)}
            bookmark_action={RenderBookmark(entry)}
            HandleOpen={HandleOpen}
          />
        ))}
      </ul>
      {query.hasNextPage && !query.isFetchNextPageError ? (
        <Button
          type="button"
          variant="outline"
          className="self-center"
          disabled={are_requests_disabled}
          onClick={() => HandleRequest(true)}
        >
          {query.isFetchingNextPage
            ? SEASON_COPY.LOADING
            : SEASON_COPY.LOAD_MORE}
        </Button>
      ) : null}
      <AnimeDetailDialog
        detail_model={detail_model}
        actions={
          visible_selected_entry === null
            ? null
            : RenderBookmark(visible_selected_entry)
        }
        HandleClose={HandleClose}
      />
    </div>
  );
}

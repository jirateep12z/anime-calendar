'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EnsureDeviceSession } from '@/features/device-session/client';
import { UsePwa } from '@/features/pwa/client';
import { ReadAllBookmarkMediaIds } from '../api/bookmark-api-client';
import { RefreshBookmarkCatalog } from '../services/bookmark-catalog-sync';
import { MergeBookmarkState } from '../services/merge-bookmark-state';
import { ReplayBookmarkOutbox } from '../services/replay-bookmark-outbox';
import {
  ReadBookmarkCatalogEntries,
  WriteBookmarkCatalogEntries
} from '../storage/bookmark-catalog';
import {
  QueueBookmarkMutation,
  ReadBookmarkSnapshot,
  ReadPendingBookmarkMutations
} from '../storage/bookmark-outbox';
import { BookmarkContext } from './bookmark-context';

import type { ReactNode } from 'react';
import type {
  BookmarkCatalogEntry,
  BookmarkContextValue
} from '../types/bookmark';

const EMPTY_MEDIA_IDS: ReadonlySet<number> = Object.freeze(new Set<number>());
const EMPTY_CATALOG: ReadonlyMap<number, BookmarkCatalogEntry> = new Map();

interface BookmarkProviderProps {
  readonly children: ReactNode;
}

function CreatePendingMediaIds(
  pending_mutations: readonly { readonly anilist_media_id: number }[]
): ReadonlySet<number> {
  return Object.freeze(
    new Set(pending_mutations.map(({ anilist_media_id }) => anilist_media_id))
  );
}

function ReadActionableBookmarkErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'ซิงก์บุ๊กมาร์กกับเซิร์ฟเวอร์ไม่สำเร็จ';
}

export function BookmarkProvider({ children }: BookmarkProviderProps) {
  const { is_online } = UsePwa();
  const [bookmarked_media_ids, set_bookmarked_media_ids] =
    useState<ReadonlySet<number>>(EMPTY_MEDIA_IDS);
  const [pending_media_ids, set_pending_media_ids] =
    useState<ReadonlySet<number>>(EMPTY_MEDIA_IDS);
  const [bookmark_catalog_entries, set_bookmark_catalog_entries] =
    useState<ReadonlyMap<number, BookmarkCatalogEntry>>(EMPTY_CATALOG);
  const [is_hydrated, set_is_hydrated] = useState(false);
  const [is_catalog_refreshing, set_is_catalog_refreshing] = useState(false);
  const [sync_error_message, set_sync_error_message] = useState<string | null>(
    null
  );
  const [catalog_error_message, set_catalog_error_message] = useState<
    string | null
  >(null);
  const bookmarked_media_ids_ref = useRef(bookmarked_media_ids);
  const local_media_ids_ref = useRef<ReadonlySet<number>>(EMPTY_MEDIA_IDS);

  useEffect(() => {
    bookmarked_media_ids_ref.current = bookmarked_media_ids;
  }, [bookmarked_media_ids]);

  const RefreshPendingMediaIds = useCallback(async () => {
    const pending_mutations = await ReadPendingBookmarkMutations();

    set_pending_media_ids(CreatePendingMediaIds(pending_mutations));

    return pending_mutations;
  }, []);

  const RefreshServerState = useCallback(async () => {
    const [pending_mutations, server_media_ids] = await Promise.all([
      RefreshPendingMediaIds(),
      ReadAllBookmarkMediaIds()
    ]);

    set_bookmarked_media_ids(
      MergeBookmarkState(
        local_media_ids_ref.current,
        server_media_ids,
        pending_mutations
      )
    );
  }, [RefreshPendingMediaIds]);

  const ReplayPendingMutations = useCallback(async () => {
    if (!is_online) return;

    try {
      await EnsureDeviceSession();
      const bookmark_result = await ReplayBookmarkOutbox();

      if (bookmark_result.blocking_error !== null) {
        set_sync_error_message(
          ReadActionableBookmarkErrorMessage(bookmark_result.blocking_error)
        );
        await RefreshServerState();

        return;
      }

      set_sync_error_message(null);
      await RefreshServerState();
    } catch (error) {
      set_sync_error_message(ReadActionableBookmarkErrorMessage(error));
      await RefreshPendingMediaIds();
    }
  }, [RefreshPendingMediaIds, RefreshServerState, is_online]);

  useEffect(() => {
    let is_effect_active = true;

    async function HydrateBookmarkState() {
      try {
        const [local_media_ids, pending_mutations] = await Promise.all([
          ReadBookmarkSnapshot(),
          ReadPendingBookmarkMutations()
        ]);
        const catalog_entries =
          await ReadBookmarkCatalogEntries(local_media_ids);

        if (!is_effect_active) return;

        local_media_ids_ref.current = local_media_ids;
        set_bookmarked_media_ids(local_media_ids);
        set_pending_media_ids(CreatePendingMediaIds(pending_mutations));
        set_bookmark_catalog_entries(catalog_entries);
      } catch (error) {
        if (is_effect_active) {
          set_sync_error_message(ReadActionableBookmarkErrorMessage(error));
        }
      } finally {
        if (is_effect_active) {
          set_is_hydrated(true);
        }
      }
    }

    void HydrateBookmarkState();

    return () => {
      is_effect_active = false;
    };
  }, []);

  useEffect(() => {
    if (!is_hydrated || !is_online || bookmarked_media_ids.size === 0) return;
    const abort_controller = new AbortController();

    queueMicrotask(() => {
      if (abort_controller.signal.aborted) return;
      set_is_catalog_refreshing(true);
      void RefreshBookmarkCatalog(
        bookmarked_media_ids,
        bookmark_catalog_entries,
        abort_controller.signal
      )
        .then(refreshed_entries => {
          if (!abort_controller.signal.aborted) {
            set_bookmark_catalog_entries(refreshed_entries);
            set_catalog_error_message(null);
          }
        })
        .catch(error => {
          if (!abort_controller.signal.aborted) {
            set_catalog_error_message(
              ReadActionableBookmarkErrorMessage(error)
            );
          }
        })
        .finally(() => {
          if (!abort_controller.signal.aborted) {
            set_is_catalog_refreshing(false);
          }
        });
    });

    return () => abort_controller.abort();
  }, [bookmark_catalog_entries, bookmarked_media_ids, is_hydrated, is_online]);

  useEffect(() => {
    if (is_hydrated && is_online) {
      queueMicrotask(() => void ReplayPendingMutations());
    }
  }, [ReplayPendingMutations, is_hydrated, is_online]);

  const ToggleBookmark = useCallback(
    async (anilist_media_id: number, catalog_entry?: BookmarkCatalogEntry) => {
      const is_bookmarked =
        !bookmarked_media_ids_ref.current.has(anilist_media_id);

      try {
        if (is_bookmarked && catalog_entry !== undefined) {
          await WriteBookmarkCatalogEntries([catalog_entry]);
          set_bookmark_catalog_entries(current_entries => {
            const next_entries = new Map(current_entries);

            next_entries.set(anilist_media_id, catalog_entry);

            return next_entries;
          });
        }

        await QueueBookmarkMutation(anilist_media_id, is_bookmarked);
        set_bookmarked_media_ids(current_media_ids => {
          const next_media_ids = new Set(current_media_ids);

          if (is_bookmarked) {
            next_media_ids.add(anilist_media_id);
          } else {
            next_media_ids.delete(anilist_media_id);
          }

          return Object.freeze(next_media_ids);
        });
        await RefreshPendingMediaIds();
        set_sync_error_message(null);
        if (is_online) {
          await ReplayPendingMutations();
        }
      } catch (error) {
        set_sync_error_message(ReadActionableBookmarkErrorMessage(error));
      }
    },
    [RefreshPendingMediaIds, ReplayPendingMutations, is_online]
  );

  const context_value = useMemo<BookmarkContextValue>(
    () => ({
      bookmarked_media_ids,
      pending_media_ids,
      bookmark_catalog_entries,
      bookmark_count: bookmarked_media_ids.size,
      is_hydrated,
      is_catalog_refreshing,
      sync_error_message,
      catalog_error_message,
      ToggleBookmark,
      RetryPendingMutations: ReplayPendingMutations
    }),
    [
      ReplayPendingMutations,
      ToggleBookmark,
      bookmarked_media_ids,
      bookmark_catalog_entries,
      catalog_error_message,
      is_catalog_refreshing,
      is_hydrated,
      pending_media_ids,
      sync_error_message
    ]
  );

  return (
    <BookmarkContext.Provider value={context_value}>
      {children}
    </BookmarkContext.Provider>
  );
}

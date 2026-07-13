'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { UsePwa } from '@/features/pwa/hooks/use-pwa';
import {
  EnsureDeviceSession,
  ReadAllBookmarkMediaIds,
  ReadNotificationPreferences
} from '../api/notification-api-client';
import { UseNotificationCapability } from '../hooks/use-notification-capability';
import { UsePushSubscription } from '../hooks/use-push-subscription';
import { RefreshBookmarkCatalog } from '../services/bookmark-catalog-sync';
import { MergeBookmarkState } from '../services/merge-bookmark-state';
import { ReplayBookmarkOutbox } from '../services/replay-bookmark-outbox';
import { ReplayPreferenceOutbox } from '../services/replay-preference-outbox';
import {
  ReadBookmarkCatalogEntries,
  WriteBookmarkCatalogEntries
} from '../storage/bookmark-catalog';
import {
  QueueBookmarkMutation,
  ReadBookmarkSnapshot,
  ReadPendingBookmarkMutations
} from '../storage/bookmark-outbox';
import {
  QueuePreferenceMutation,
  ReadNotificationLocalState,
  ReadPendingPreferenceMutation
} from '../storage/preference-outbox';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notification';

import type { ReactNode } from 'react';
import type {
  BookmarkCatalogEntry,
  NotificationContextValue,
  NotificationMode,
  NotificationPreferences
} from '../types/notification';

const EMPTY_MEDIA_IDS: ReadonlySet<number> = Object.freeze(new Set<number>());
const EMPTY_CATALOG: ReadonlyMap<number, BookmarkCatalogEntry> = new Map();

export const NotificationContext =
  createContext<NotificationContextValue | null>(null);

interface NotificationProviderProps {
  readonly children: ReactNode;
}

function CreatePendingMediaIds(
  pending_mutations: readonly { readonly anilist_media_id: number }[]
): ReadonlySet<number> {
  return Object.freeze(
    new Set(pending_mutations.map(({ anilist_media_id }) => anilist_media_id))
  );
}

function ReadActionableErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'ซิงก์การตั้งค่ากับเซิร์ฟเวอร์ไม่สำเร็จ';
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { is_online } = UsePwa();
  const capability_status = UseNotificationCapability();
  const { Subscribe, Unsubscribe, ReadHasSubscription } = UsePushSubscription();
  const [bookmarked_media_ids, set_bookmarked_media_ids] =
    useState<ReadonlySet<number>>(EMPTY_MEDIA_IDS);
  const [pending_media_ids, set_pending_media_ids] =
    useState<ReadonlySet<number>>(EMPTY_MEDIA_IDS);
  const [bookmark_catalog_entries, set_bookmark_catalog_entries] =
    useState<ReadonlyMap<number, BookmarkCatalogEntry>>(EMPTY_CATALOG);
  const [preferences, set_preferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [is_push_subscribed, set_is_push_subscribed] = useState(false);
  const [is_hydrated, set_is_hydrated] = useState(false);
  const [is_initial_sync_completed, set_is_initial_sync_completed] =
    useState(false);
  const [is_catalog_refreshing, set_is_catalog_refreshing] = useState(false);
  const [sync_error_message, set_sync_error_message] = useState<string | null>(
    null
  );
  const [catalog_error_message, set_catalog_error_message] = useState<
    string | null
  >(null);
  const bookmarked_media_ids_ref = useRef(bookmarked_media_ids);
  const preferences_ref = useRef(preferences);
  const local_media_ids_ref = useRef<ReadonlySet<number>>(EMPTY_MEDIA_IDS);

  useEffect(() => {
    bookmarked_media_ids_ref.current = bookmarked_media_ids;
  }, [bookmarked_media_ids]);

  useEffect(() => {
    preferences_ref.current = preferences;
  }, [preferences]);

  const RefreshPendingMediaIds = useCallback(async () => {
    const pending_mutations = await ReadPendingBookmarkMutations();

    set_pending_media_ids(CreatePendingMediaIds(pending_mutations));

    return pending_mutations;
  }, []);

  const RefreshServerState = useCallback(async () => {
    const pending_mutations = await RefreshPendingMediaIds();
    const pending_preference_mutation = await ReadPendingPreferenceMutation();
    const [server_media_ids, server_preferences] = await Promise.all([
      ReadAllBookmarkMediaIds(),
      ReadNotificationPreferences()
    ]);

    set_bookmarked_media_ids(
      MergeBookmarkState(
        local_media_ids_ref.current,
        server_media_ids,
        pending_mutations
      )
    );
    if (pending_preference_mutation === null) {
      const next_preferences = Object.freeze({
        is_notification_enabled: server_preferences.is_notification_enabled,
        notification_mode: server_preferences.notification_mode,
        is_adult_confirmed: server_preferences.is_adult_confirmed,
        is_adult_content_visible: server_preferences.is_adult_content_visible
      });

      preferences_ref.current = next_preferences;
      set_preferences(next_preferences);
    }
  }, [RefreshPendingMediaIds]);

  const ReplayPendingMutations = useCallback(async () => {
    if (!is_online) {
      return;
    }

    try {
      await EnsureDeviceSession();
      const bookmark_result = await ReplayBookmarkOutbox();
      const preference_result = await ReplayPreferenceOutbox();
      const blocking_error =
        bookmark_result.blocking_error ?? preference_result.blocking_error;

      if (blocking_error !== null) {
        set_sync_error_message(ReadActionableErrorMessage(blocking_error));
        await RefreshServerState();

        return;
      }

      set_sync_error_message(null);
      await RefreshServerState();
    } catch (error) {
      set_sync_error_message(ReadActionableErrorMessage(error));
      await RefreshPendingMediaIds();
    }
  }, [RefreshPendingMediaIds, RefreshServerState, is_online]);

  useEffect(() => {
    let is_effect_active = true;

    async function HydrateNotificationState() {
      try {
        const [local_media_ids, pending_mutations, local_preferences] =
          await Promise.all([
            ReadBookmarkSnapshot(),
            ReadPendingBookmarkMutations(),
            ReadNotificationLocalState()
          ]);

        if (!is_effect_active) {
          return;
        }

        local_media_ids_ref.current = local_media_ids;
        set_bookmarked_media_ids(local_media_ids);
        set_pending_media_ids(CreatePendingMediaIds(pending_mutations));
        set_bookmark_catalog_entries(
          await ReadBookmarkCatalogEntries(local_media_ids)
        );
        if (local_preferences !== null) {
          preferences_ref.current = local_preferences;
          set_preferences(local_preferences);
        }
      } catch (error) {
        if (is_effect_active) {
          set_sync_error_message(ReadActionableErrorMessage(error));
        }
      } finally {
        if (is_effect_active) {
          set_is_hydrated(true);
        }
      }
    }

    void HydrateNotificationState();

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
            set_catalog_error_message(ReadActionableErrorMessage(error));
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
      let is_effect_active = true;

      queueMicrotask(() => {
        void ReplayPendingMutations().finally(() => {
          if (is_effect_active) {
            set_is_initial_sync_completed(true);
          }
        });
      });

      return () => {
        is_effect_active = false;
      };
    }

    if (is_hydrated) {
      queueMicrotask(() => set_is_initial_sync_completed(true));
    }
  }, [ReplayPendingMutations, is_hydrated, is_online]);

  useEffect(() => {
    let is_effect_active = true;

    if (capability_status !== 'SUPPORTED') {
      queueMicrotask(() => {
        if (is_effect_active) {
          set_is_push_subscribed(false);
        }
      });

      return () => {
        is_effect_active = false;
      };
    }

    void ReadHasSubscription().then(has_subscription => {
      if (is_effect_active) {
        set_is_push_subscribed(has_subscription);
      }
    });

    return () => {
      is_effect_active = false;
    };
  }, [ReadHasSubscription, capability_status]);

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
        set_sync_error_message(ReadActionableErrorMessage(error));
      }
    },
    [RefreshPendingMediaIds, ReplayPendingMutations, is_online]
  );

  const QueueAndApplyPreferences = useCallback(
    async (next_preferences: NotificationPreferences) => {
      await QueuePreferenceMutation(next_preferences);
      const immutable_preferences = Object.freeze({ ...next_preferences });

      preferences_ref.current = immutable_preferences;
      set_preferences(immutable_preferences);
      set_sync_error_message(null);
      if (is_online) {
        await ReplayPendingMutations();
      }
    },
    [ReplayPendingMutations, is_online]
  );

  const EnableNotifications = useCallback(async () => {
    try {
      await Subscribe();
      set_is_push_subscribed(true);
      await QueueAndApplyPreferences({
        ...preferences_ref.current,
        is_notification_enabled: true
      });
    } catch (error) {
      set_sync_error_message(ReadActionableErrorMessage(error));

      throw error;
    }
  }, [QueueAndApplyPreferences, Subscribe]);

  const DisableNotifications = useCallback(async () => {
    const next_preferences = Object.freeze({
      ...preferences_ref.current,
      is_notification_enabled: false
    });

    await QueueAndApplyPreferences(next_preferences);
    set_is_push_subscribed(false);
    try {
      await Unsubscribe();
    } catch (error) {
      set_sync_error_message(ReadActionableErrorMessage(error));
    }
  }, [QueueAndApplyPreferences, Unsubscribe]);

  const ChangeNotificationMode = useCallback(
    async (notification_mode: NotificationMode) => {
      await QueueAndApplyPreferences({
        ...preferences_ref.current,
        notification_mode
      });
    },
    [QueueAndApplyPreferences]
  );

  const SyncAdultPreference = useCallback(
    async (is_adult_confirmed: boolean, is_adult_content_visible: boolean) => {
      if (
        !is_initial_sync_completed ||
        (preferences_ref.current.is_adult_confirmed === is_adult_confirmed &&
          preferences_ref.current.is_adult_content_visible ===
            is_adult_content_visible)
      ) {
        return;
      }

      await QueueAndApplyPreferences({
        ...preferences_ref.current,
        is_adult_confirmed,
        is_adult_content_visible
      });
    },
    [QueueAndApplyPreferences, is_initial_sync_completed]
  );

  const context_value = useMemo<NotificationContextValue>(
    () => ({
      bookmarked_media_ids,
      pending_media_ids,
      bookmark_catalog_entries,
      preferences,
      capability_status,
      bookmark_count: bookmarked_media_ids.size,
      is_push_subscribed,
      is_hydrated,
      is_catalog_refreshing,
      sync_error_message,
      catalog_error_message,
      ToggleBookmark,
      EnableNotifications,
      DisableNotifications,
      ChangeNotificationMode,
      SyncAdultPreference,
      RetryPendingMutations: ReplayPendingMutations
    }),
    [
      ChangeNotificationMode,
      DisableNotifications,
      EnableNotifications,
      ReplayPendingMutations,
      SyncAdultPreference,
      ToggleBookmark,
      bookmarked_media_ids,
      bookmark_catalog_entries,
      capability_status,
      catalog_error_message,
      is_hydrated,
      is_catalog_refreshing,
      is_push_subscribed,
      pending_media_ids,
      preferences,
      sync_error_message
    ]
  );

  return (
    <NotificationContext.Provider value={context_value}>
      {children}
    </NotificationContext.Provider>
  );
}

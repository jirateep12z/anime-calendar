'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { UseBookmarks } from '@/features/anime-bookmarks/client';
import { EnsureDeviceSession } from '@/features/device-session/client';
import { UsePwa } from '@/features/pwa/client';
import { ReadNotificationPreferences } from '../api/notification-api-client';
import { UseNotificationCapability } from '../hooks/use-notification-capability';
import { UsePushSubscription } from '../hooks/use-push-subscription';
import { ReplayPreferenceOutbox } from '../services/replay-preference-outbox';
import {
  QueuePreferenceMutation,
  ReadNotificationLocalState,
  ReadPendingPreferenceMutation
} from '../storage/preference-outbox';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notification';

import type { ReactNode } from 'react';
import type {
  NotificationContextValue,
  NotificationMode,
  NotificationPreferences
} from '../types/notification';

export const NotificationContext =
  createContext<NotificationContextValue | null>(null);

interface NotificationProviderProps {
  readonly children: ReactNode;
}

function ReadActionableErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'ซิงก์การตั้งค่ากับเซิร์ฟเวอร์ไม่สำเร็จ';
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { is_online } = UsePwa();
  const {
    sync_error_message: bookmark_sync_error_message,
    RetryPendingMutations: RetryBookmarkPendingMutations
  } = UseBookmarks();
  const capability_status = UseNotificationCapability();
  const { Subscribe, Unsubscribe, ReadHasSubscription } = UsePushSubscription();
  const [preferences, set_preferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [is_push_subscribed, set_is_push_subscribed] = useState(false);
  const [is_hydrated, set_is_hydrated] = useState(false);
  const [is_initial_sync_completed, set_is_initial_sync_completed] =
    useState(false);
  const [preference_sync_error_message, set_preference_sync_error_message] =
    useState<string | null>(null);
  const preferences_ref = useRef(preferences);

  useEffect(() => {
    preferences_ref.current = preferences;
  }, [preferences]);

  const RefreshServerPreferences = useCallback(async () => {
    const pending_preference_mutation = await ReadPendingPreferenceMutation();
    const server_preferences = await ReadNotificationPreferences();

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
  }, []);

  const ReplayPendingPreferences = useCallback(async () => {
    if (!is_online) {
      return;
    }

    try {
      await EnsureDeviceSession();
      const preference_result = await ReplayPreferenceOutbox();

      if (preference_result.blocking_error !== null) {
        set_preference_sync_error_message(
          ReadActionableErrorMessage(preference_result.blocking_error)
        );
        await RefreshServerPreferences();

        return;
      }

      set_preference_sync_error_message(null);
      await RefreshServerPreferences();
    } catch (error) {
      set_preference_sync_error_message(ReadActionableErrorMessage(error));
    }
  }, [RefreshServerPreferences, is_online]);

  useEffect(() => {
    let is_effect_active = true;

    async function HydrateNotificationState() {
      try {
        const local_preferences = await ReadNotificationLocalState();

        if (!is_effect_active) {
          return;
        }

        if (local_preferences !== null) {
          preferences_ref.current = local_preferences;
          set_preferences(local_preferences);
        }
      } catch (error) {
        if (is_effect_active) {
          set_preference_sync_error_message(ReadActionableErrorMessage(error));
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
    if (is_hydrated && is_online) {
      let is_effect_active = true;

      queueMicrotask(() => {
        void ReplayPendingPreferences().finally(() => {
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
  }, [ReplayPendingPreferences, is_hydrated, is_online]);

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

  const QueueAndApplyPreferences = useCallback(
    async (next_preferences: NotificationPreferences) => {
      await QueuePreferenceMutation(next_preferences);
      const immutable_preferences = Object.freeze({ ...next_preferences });

      preferences_ref.current = immutable_preferences;
      set_preferences(immutable_preferences);
      set_preference_sync_error_message(null);
      if (is_online) {
        await ReplayPendingPreferences();
      }
    },
    [ReplayPendingPreferences, is_online]
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
      set_preference_sync_error_message(ReadActionableErrorMessage(error));

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
      set_preference_sync_error_message(ReadActionableErrorMessage(error));
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

  const RetryPendingMutations = useCallback(async () => {
    await Promise.all([
      RetryBookmarkPendingMutations(),
      ReplayPendingPreferences()
    ]);
  }, [ReplayPendingPreferences, RetryBookmarkPendingMutations]);
  const sync_error_message =
    preference_sync_error_message ?? bookmark_sync_error_message;

  const notification_context_value = useMemo<NotificationContextValue>(
    () => ({
      preferences,
      capability_status,
      is_push_subscribed,
      sync_error_message,
      EnableNotifications,
      DisableNotifications,
      ChangeNotificationMode,
      SyncAdultPreference,
      RetryPendingMutations
    }),
    [
      ChangeNotificationMode,
      DisableNotifications,
      EnableNotifications,
      RetryPendingMutations,
      SyncAdultPreference,
      capability_status,
      is_push_subscribed,
      preferences,
      sync_error_message
    ]
  );

  return (
    <NotificationContext.Provider value={notification_context_value}>
      {children}
    </NotificationContext.Provider>
  );
}

import {
  NotificationStorageError,
  OpenNotificationDatabase
} from './notification-database';

import type {
  NotificationLocalState,
  NotificationPreferences,
  PreferenceMutation
} from '../types/notification';

const CURRENT_RECORD_KEY = 'current';

function FreezePreferences(
  preferences: NotificationPreferences
): NotificationPreferences {
  return Object.freeze({ ...preferences });
}

export async function QueuePreferenceMutation(
  preferences: NotificationPreferences
): Promise<PreferenceMutation> {
  if (preferences.is_adult_content_visible && !preferences.is_adult_confirmed) {
    throw new RangeError('Adult content visibility requires confirmation.');
  }

  try {
    const database = await OpenNotificationDatabase();
    const transaction = database.transaction(
      ['preference_mutations', 'notification_local_state'],
      'readwrite'
    );
    const immutable_preferences = FreezePreferences(preferences);
    const mutation: PreferenceMutation = Object.freeze({
      client_mutation_id: crypto.randomUUID(),
      created_at: Date.now(),
      preferences: immutable_preferences
    });

    await Promise.all([
      transaction
        .objectStore('preference_mutations')
        .put(mutation, CURRENT_RECORD_KEY),
      transaction
        .objectStore('notification_local_state')
        .put(immutable_preferences, CURRENT_RECORD_KEY)
    ]);
    await transaction.done;

    return mutation;
  } catch (error) {
    if (error instanceof NotificationStorageError) {
      throw error;
    }

    throw new NotificationStorageError(error);
  }
}

export async function ReadPendingPreferenceMutation(): Promise<PreferenceMutation | null> {
  try {
    const database = await OpenNotificationDatabase();
    const mutation = await database.get(
      'preference_mutations',
      CURRENT_RECORD_KEY
    );

    return mutation ? Object.freeze(mutation) : null;
  } catch (error) {
    if (error instanceof NotificationStorageError) {
      throw error;
    }

    throw new NotificationStorageError(error);
  }
}

export async function CompletePreferenceMutation(
  client_mutation_id: string
): Promise<void> {
  try {
    const database = await OpenNotificationDatabase();
    const transaction = database.transaction(
      'preference_mutations',
      'readwrite'
    );
    const mutation = await transaction.store.get(CURRENT_RECORD_KEY);

    if (mutation?.client_mutation_id === client_mutation_id) {
      await transaction.store.delete(CURRENT_RECORD_KEY);
    }

    await transaction.done;
  } catch (error) {
    if (error instanceof NotificationStorageError) {
      throw error;
    }

    throw new NotificationStorageError(error);
  }
}

export async function ReadNotificationLocalState(): Promise<NotificationLocalState | null> {
  try {
    const database = await OpenNotificationDatabase();
    const local_state = await database.get(
      'notification_local_state',
      CURRENT_RECORD_KEY
    );

    return local_state ? FreezePreferences(local_state) : null;
  } catch (error) {
    if (error instanceof NotificationStorageError) {
      throw error;
    }

    throw new NotificationStorageError(error);
  }
}

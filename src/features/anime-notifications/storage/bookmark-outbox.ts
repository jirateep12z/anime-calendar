import {
  NotificationStorageError,
  OpenNotificationDatabase
} from './notification-database';

import type { BookmarkMutation } from '../types/notification';

const BOOKMARK_SEQUENCE_KEY = 'bookmark-sequence';

function ValidateMediaId(anilist_media_id: number): void {
  if (!Number.isSafeInteger(anilist_media_id) || anilist_media_id <= 0) {
    throw new RangeError('AniList media ID must be a positive safe integer.');
  }
}

export async function ReadBookmarkSnapshot(): Promise<ReadonlySet<number>> {
  try {
    const database = await OpenNotificationDatabase();
    const snapshot_records = await database.getAll('bookmark_snapshot');

    return Object.freeze(
      new Set(
        snapshot_records
          .filter(({ is_bookmarked }) => is_bookmarked)
          .map(({ anilist_media_id }) => anilist_media_id)
      )
    );
  } catch (error) {
    if (error instanceof NotificationStorageError) {
      throw error;
    }

    throw new NotificationStorageError(error);
  }
}

export async function QueueBookmarkMutation(
  anilist_media_id: number,
  is_bookmarked: boolean
): Promise<BookmarkMutation> {
  ValidateMediaId(anilist_media_id);

  try {
    const database = await OpenNotificationDatabase();
    const transaction = database.transaction(
      ['metadata', 'bookmark_snapshot', 'bookmark_mutations'],
      'readwrite'
    );
    const metadata_store = transaction.objectStore('metadata');
    const mutation_store = transaction.objectStore('bookmark_mutations');
    const sequence_record = await metadata_store.get(BOOKMARK_SEQUENCE_KEY);
    const client_sequence = (sequence_record?.numeric_value ?? 0) + 1;
    const mutation: BookmarkMutation = Object.freeze({
      client_mutation_id: crypto.randomUUID(),
      client_sequence,
      anilist_media_id,
      is_bookmarked,
      created_at: Date.now()
    });
    const mutation_keys = await mutation_store
      .index('by-media-id')
      .getAllKeys(anilist_media_id);

    await Promise.all(
      mutation_keys.map(mutation_key => mutation_store.delete(mutation_key))
    );
    await mutation_store.put(mutation);
    await transaction.objectStore('bookmark_snapshot').put({
      anilist_media_id,
      is_bookmarked
    });
    await metadata_store.put({
      key: BOOKMARK_SEQUENCE_KEY,
      numeric_value: client_sequence
    });
    await transaction.done;

    return mutation;
  } catch (error) {
    if (error instanceof NotificationStorageError) {
      throw error;
    }

    throw new NotificationStorageError(error);
  }
}

export async function ReadPendingBookmarkMutations(): Promise<
  readonly BookmarkMutation[]
> {
  try {
    const database = await OpenNotificationDatabase();
    const mutations = await database.getAllFromIndex(
      'bookmark_mutations',
      'by-sequence'
    );

    return Object.freeze(mutations.map(mutation => Object.freeze(mutation)));
  } catch (error) {
    if (error instanceof NotificationStorageError) {
      throw error;
    }

    throw new NotificationStorageError(error);
  }
}

export async function CompleteBookmarkMutation(
  client_mutation_id: string
): Promise<void> {
  try {
    const database = await OpenNotificationDatabase();

    await database.delete('bookmark_mutations', client_mutation_id);
  } catch (error) {
    if (error instanceof NotificationStorageError) {
      throw error;
    }

    throw new NotificationStorageError(error);
  }
}

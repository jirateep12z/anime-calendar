import { openDB } from 'idb';

import type { DBSchema, IDBPDatabase } from 'idb';
import type {
  BookmarkCatalogEntry,
  BookmarkMutation,
  LocalDeliveryHistoryEntry,
  NotificationLocalState,
  PreferenceMutation
} from '../types/notification';

const NOTIFICATION_DATABASE_NAME = 'anime-calendar-notifications';
const NOTIFICATION_DATABASE_VERSION = 2;

export type NotificationStorageErrorCode = 'OFFLINE_STORAGE_UNAVAILABLE';

export class NotificationStorageError extends Error {
  public readonly error_code: NotificationStorageErrorCode;
  public readonly cause: unknown;

  public constructor(cause: unknown) {
    super('Offline notification storage is unavailable.');
    this.name = 'NotificationStorageError';
    this.error_code = 'OFFLINE_STORAGE_UNAVAILABLE';
    this.cause = cause;
  }
}

interface BookmarkSnapshotRecord {
  readonly anilist_media_id: number;
  readonly is_bookmarked: boolean;
}

interface MetadataRecord {
  readonly key: string;
  readonly numeric_value: number;
}

export interface NotificationDatabaseSchema extends DBSchema {
  bookmark_catalog: {
    key: number;
    value: BookmarkCatalogEntry;
  };
  bookmark_snapshot: {
    key: number;
    value: BookmarkSnapshotRecord;
  };
  bookmark_mutations: {
    key: string;
    value: BookmarkMutation;
    indexes: {
      'by-media-id': number;
      'by-sequence': number;
    };
  };
  preference_mutations: {
    key: 'current';
    value: PreferenceMutation;
  };
  metadata: {
    key: string;
    value: MetadataRecord;
  };
  notification_local_state: {
    key: 'current';
    value: NotificationLocalState;
  };
  local_delivery_history: {
    key: number;
    value: LocalDeliveryHistoryEntry;
  };
}

let database_promise: Promise<IDBPDatabase<NotificationDatabaseSchema>> | null =
  null;

function CreateNotificationDatabase(): Promise<
  IDBPDatabase<NotificationDatabaseSchema>
> {
  return openDB<NotificationDatabaseSchema>(
    NOTIFICATION_DATABASE_NAME,
    NOTIFICATION_DATABASE_VERSION,
    {
      upgrade(database, old_version) {
        if (old_version < 1) {
          database.createObjectStore('bookmark_snapshot', {
            keyPath: 'anilist_media_id'
          });
          const bookmark_mutation_store = database.createObjectStore(
            'bookmark_mutations',
            { keyPath: 'client_mutation_id' }
          );

          bookmark_mutation_store.createIndex(
            'by-media-id',
            'anilist_media_id'
          );
          bookmark_mutation_store.createIndex('by-sequence', 'client_sequence');
          database.createObjectStore('preference_mutations');
          database.createObjectStore('metadata', { keyPath: 'key' });
          database.createObjectStore('notification_local_state');
          database.createObjectStore('local_delivery_history', {
            keyPath: 'anilist_schedule_id'
          });
        }

        if (old_version < 2) {
          database.createObjectStore('bookmark_catalog', {
            keyPath: 'anilist_media_id'
          });
        }
      }
    }
  );
}

export async function OpenNotificationDatabase(): Promise<
  IDBPDatabase<NotificationDatabaseSchema>
> {
  try {
    database_promise ??= CreateNotificationDatabase();

    return await database_promise;
  } catch (error) {
    database_promise = null;

    throw new NotificationStorageError(error);
  }
}

export async function ResetNotificationDatabaseForTest(): Promise<void> {
  const database = await database_promise;

  database?.close();
  database_promise = null;
  await new Promise<void>((resolve, reject) => {
    const delete_request = indexedDB.deleteDatabase(NOTIFICATION_DATABASE_NAME);

    delete_request.addEventListener('success', () => resolve());
    delete_request.addEventListener('error', () =>
      reject(delete_request.error)
    );
    delete_request.addEventListener('blocked', () =>
      reject(new Error('Notification database deletion was blocked.'))
    );
  });
}

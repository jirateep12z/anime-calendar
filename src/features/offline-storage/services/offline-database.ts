import { openDB } from 'idb';

import type { DBSchema, IDBPDatabase } from 'idb';
import type {
  StoredBookmarkCatalogEntry,
  StoredBookmarkMutation,
  StoredBookmarkSnapshotRecord,
  StoredLocalDeliveryHistoryEntry,
  StoredMetadataRecord,
  StoredNotificationPreferences,
  StoredPreferenceMutation
} from '../types/persisted-records';

const OFFLINE_DATABASE_NAME = 'anime-calendar-notifications';
const OFFLINE_DATABASE_VERSION = 1;

export type OfflineStorageErrorCode = 'OFFLINE_STORAGE_UNAVAILABLE';

export class OfflineStorageError extends Error {
  public readonly error_code: OfflineStorageErrorCode;
  public readonly cause: unknown;

  public constructor(cause: unknown) {
    super('Offline storage is unavailable.');
    this.name = 'OfflineStorageError';
    this.error_code = 'OFFLINE_STORAGE_UNAVAILABLE';
    this.cause = cause;
  }
}

export interface OfflineDatabaseSchema extends DBSchema {
  bookmark_catalog: {
    key: number;
    value: StoredBookmarkCatalogEntry;
  };
  bookmark_snapshot: {
    key: number;
    value: StoredBookmarkSnapshotRecord;
  };
  bookmark_mutations: {
    key: string;
    value: StoredBookmarkMutation;
    indexes: {
      'by-media-id': number;
      'by-sequence': number;
    };
  };
  preference_mutations: {
    key: 'current';
    value: StoredPreferenceMutation;
  };
  metadata: {
    key: string;
    value: StoredMetadataRecord;
  };
  notification_local_state: {
    key: 'current';
    value: StoredNotificationPreferences;
  };
  local_delivery_history: {
    key: number;
    value: StoredLocalDeliveryHistoryEntry;
  };
}

let database_promise: Promise<IDBPDatabase<OfflineDatabaseSchema>> | null =
  null;

function CreateOfflineDatabase(): Promise<IDBPDatabase<OfflineDatabaseSchema>> {
  return openDB<OfflineDatabaseSchema>(
    OFFLINE_DATABASE_NAME,
    OFFLINE_DATABASE_VERSION,
    {
      upgrade(database) {
        database.createObjectStore('bookmark_snapshot', {
          keyPath: 'anilist_media_id'
        });
        const bookmark_mutation_store = database.createObjectStore(
          'bookmark_mutations',
          { keyPath: 'client_mutation_id' }
        );

        bookmark_mutation_store.createIndex('by-media-id', 'anilist_media_id');
        bookmark_mutation_store.createIndex('by-sequence', 'client_sequence');
        database.createObjectStore('preference_mutations');
        database.createObjectStore('metadata', { keyPath: 'key' });
        database.createObjectStore('notification_local_state');
        database.createObjectStore('local_delivery_history', {
          keyPath: 'anilist_schedule_id'
        });
        database.createObjectStore('bookmark_catalog', {
          keyPath: 'anilist_media_id'
        });
      }
    }
  );
}

export async function OpenOfflineDatabase(): Promise<
  IDBPDatabase<OfflineDatabaseSchema>
> {
  try {
    database_promise ??= CreateOfflineDatabase();

    return await database_promise;
  } catch (error) {
    database_promise = null;

    throw new OfflineStorageError(error);
  }
}

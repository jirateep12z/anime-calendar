import {
  NotificationStorageError,
  OpenNotificationDatabase
} from './notification-database';

import type { BookmarkCatalogEntry } from '../types/notification';

export async function ReadBookmarkCatalog(): Promise<
  ReadonlyMap<number, BookmarkCatalogEntry>
> {
  try {
    const database = await OpenNotificationDatabase();
    const catalog_entries = await database.getAll('bookmark_catalog');

    return new Map(
      catalog_entries.map(catalog_entry => [
        catalog_entry.anilist_media_id,
        Object.freeze(catalog_entry)
      ])
    );
  } catch (error) {
    if (error instanceof NotificationStorageError) throw error;

    throw new NotificationStorageError(error);
  }
}

export async function ReadBookmarkCatalogEntries(
  anilist_media_ids: ReadonlySet<number>
): Promise<ReadonlyMap<number, BookmarkCatalogEntry>> {
  try {
    const database = await OpenNotificationDatabase();
    const catalog_entries = await Promise.all(
      [...anilist_media_ids].map(anilist_media_id =>
        database.get('bookmark_catalog', anilist_media_id)
      )
    );

    return new Map(
      catalog_entries.flatMap(catalog_entry =>
        catalog_entry === undefined
          ? []
          : [[catalog_entry.anilist_media_id, Object.freeze(catalog_entry)]]
      )
    );
  } catch (error) {
    if (error instanceof NotificationStorageError) throw error;

    throw new NotificationStorageError(error);
  }
}

export async function WriteBookmarkCatalogEntries(
  catalog_entries: readonly BookmarkCatalogEntry[]
): Promise<void> {
  try {
    const database = await OpenNotificationDatabase();
    const transaction = database.transaction('bookmark_catalog', 'readwrite');

    await Promise.all([
      ...catalog_entries.map(catalog_entry =>
        transaction.store.put(catalog_entry)
      ),
      transaction.done
    ]);
  } catch (error) {
    if (error instanceof NotificationStorageError) throw error;

    throw new NotificationStorageError(error);
  }
}

export async function DeleteBookmarkCatalogEntry(
  anilist_media_id: number
): Promise<void> {
  try {
    const database = await OpenNotificationDatabase();

    await database.delete('bookmark_catalog', anilist_media_id);
  } catch (error) {
    if (error instanceof NotificationStorageError) throw error;

    throw new NotificationStorageError(error);
  }
}

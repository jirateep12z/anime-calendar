import { OpenOfflineDatabase } from '@/features/offline-storage/client';

const DELIVERY_RETENTION_MILLISECONDS = 90 * 24 * 60 * 60 * 1_000;

export async function ReadLocalDeliveryScheduleIds(
  now_milliseconds: number
): Promise<ReadonlySet<number>> {
  const database = await OpenOfflineDatabase();
  const transaction = database.transaction(
    'local_delivery_history',
    'readwrite'
  );
  const history_entries = await transaction.store.getAll();
  const oldest_allowed_timestamp =
    now_milliseconds - DELIVERY_RETENTION_MILLISECONDS;
  const displayed_schedule_ids = new Set<number>();

  for (const history_entry of history_entries) {
    if (history_entry.displayed_at < oldest_allowed_timestamp) {
      await transaction.store.delete(history_entry.anilist_schedule_id);
    } else {
      displayed_schedule_ids.add(history_entry.anilist_schedule_id);
    }
  }

  await transaction.done;

  return Object.freeze(displayed_schedule_ids);
}

export async function RecordLocalDelivery(
  anilist_schedule_id: number,
  displayed_at: number
): Promise<void> {
  const database = await OpenOfflineDatabase();

  await database.put('local_delivery_history', {
    anilist_schedule_id,
    displayed_at
  });
}

import { OpenOfflineDatabase } from '@/features/offline-storage/worker';

import type { NotificationLocalState } from '../types/notification';

export async function ReadWorkerNotificationLocalState(): Promise<NotificationLocalState | null> {
  const database = await OpenOfflineDatabase();

  return (await database.get('notification_local_state', 'current')) ?? null;
}

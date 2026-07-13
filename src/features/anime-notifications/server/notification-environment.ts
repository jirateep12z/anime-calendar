import 'server-only';

import { z } from 'zod';

const NotificationEnvironmentSchema = z.strictObject({
  NOTIFICATION_CRON_SECRET: z.string().min(32)
});

export interface NotificationEnvironment {
  readonly NOTIFICATION_CRON_SECRET: string;
}

export function ReadNotificationEnvironment(): NotificationEnvironment {
  return Object.freeze(
    NotificationEnvironmentSchema.parse({
      NOTIFICATION_CRON_SECRET: process.env.NOTIFICATION_CRON_SECRET
    })
  );
}

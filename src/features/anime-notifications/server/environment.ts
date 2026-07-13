import 'server-only';

import { z } from 'zod';

const ServerEnvironmentSchema = z.strictObject({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(32),
  NOTIFICATION_CRON_SECRET: z.string().min(32)
});

export type ServerEnvironment = Readonly<
  z.infer<typeof ServerEnvironmentSchema>
>;

export function ReadServerEnvironment(): ServerEnvironment {
  return Object.freeze(
    ServerEnvironmentSchema.parse({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NOTIFICATION_CRON_SECRET: process.env.NOTIFICATION_CRON_SECRET
    })
  );
}

import 'server-only';

import { z } from 'zod';

const RateLimitSecretSchema = z.string().min(32);

export function ReadRateLimitSecret(): string {
  return RateLimitSecretSchema.parse(process.env.NOTIFICATION_CRON_SECRET);
}

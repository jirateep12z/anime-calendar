import 'server-only';

import { z } from 'zod';

const SupabaseEnvironmentSchema = z.strictObject({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(32)
});

export type SupabaseEnvironment = Readonly<
  z.infer<typeof SupabaseEnvironmentSchema>
>;

export function ReadSupabaseEnvironment(): SupabaseEnvironment {
  return Object.freeze(
    SupabaseEnvironmentSchema.parse({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
    })
  );
}

import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { ReadServerEnvironment } from './environment';

let supabase_admin_client: SupabaseClient | null = null;

export function ReadSupabaseAdminClient(): SupabaseClient {
  if (supabase_admin_client !== null) {
    return supabase_admin_client;
  }

  const environment = ReadServerEnvironment();

  supabase_admin_client = createClient(
    environment.SUPABASE_URL,
    environment.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  return supabase_admin_client;
}

import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { ReadBookmarkCount } from '@/features/anime-bookmarks/server';
import { HashDeviceToken } from '@/features/device-session/server';
import { ReadSupabaseAdminClient } from '@/lib/supabase/server';

import type {
  NotificationMode,
  NotificationPreferencesMutation,
  PushSubscriptionInput
} from '../validation/notification-api-schema';

const NotificationPreferencesRowSchema = z.strictObject({
  is_notification_enabled: z.boolean(),
  notification_mode: z.enum(['ALL', 'BOOKMARKS']),
  is_adult_confirmed: z.boolean(),
  is_adult_content_visible: z.boolean()
});

export interface NotificationPreferencesResponse {
  readonly is_notification_enabled: boolean;
  readonly notification_mode: NotificationMode;
  readonly is_adult_confirmed: boolean;
  readonly is_adult_content_visible: boolean;
  readonly bookmark_count: number;
}

export class NotificationRepositoryError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'NotificationRepositoryError';
  }
}

export async function ReadNotificationPreferences(
  device_id: string,
  supabase_client: SupabaseClient = ReadSupabaseAdminClient()
): Promise<NotificationPreferencesResponse> {
  const preferences_request = supabase_client
    .from('notification_devices')
    .select(
      'is_notification_enabled, notification_mode, is_adult_confirmed, is_adult_content_visible'
    )
    .eq('id', device_id)
    .single();
  const bookmark_count_request = ReadBookmarkCount(device_id, supabase_client);
  let preferences_result: Awaited<typeof preferences_request>;
  let bookmark_count: number;

  try {
    [preferences_result, bookmark_count] = await Promise.all([
      preferences_request,
      bookmark_count_request
    ]);
  } catch {
    throw new NotificationRepositoryError(
      'Unable to read notification preferences'
    );
  }

  if (preferences_result.error !== null) {
    throw new NotificationRepositoryError(
      'Unable to read notification preferences'
    );
  }

  const parsed_preferences = NotificationPreferencesRowSchema.safeParse(
    preferences_result.data
  );

  if (!parsed_preferences.success) {
    throw new NotificationRepositoryError(
      'Notification preference record is invalid'
    );
  }

  return Object.freeze({
    ...parsed_preferences.data,
    bookmark_count
  });
}

export async function WriteNotificationPreferences(
  device_id: string,
  preferences: NotificationPreferencesMutation,
  supabase_client: SupabaseClient = ReadSupabaseAdminClient()
): Promise<NotificationPreferencesResponse> {
  const current_timestamp = new Date().toISOString();
  const { data, error } = await supabase_client
    .from('notification_devices')
    .update({ ...preferences, updated_at: current_timestamp })
    .eq('id', device_id)
    .select(
      'is_notification_enabled, notification_mode, is_adult_confirmed, is_adult_content_visible'
    )
    .single();

  if (error !== null) {
    throw new NotificationRepositoryError(
      'Unable to update notification preferences'
    );
  }

  const parsed_preferences = NotificationPreferencesRowSchema.safeParse(data);

  if (!parsed_preferences.success) {
    throw new NotificationRepositoryError(
      'Updated notification preference record is invalid'
    );
  }

  let bookmark_count: number;

  try {
    bookmark_count = await ReadBookmarkCount(device_id, supabase_client);
  } catch {
    throw new NotificationRepositoryError('Unable to count bookmarks');
  }

  return Object.freeze({
    ...parsed_preferences.data,
    bookmark_count
  });
}

export async function ReplacePushSubscription(
  device_id: string,
  input: PushSubscriptionInput,
  supabase_client: SupabaseClient = ReadSupabaseAdminClient()
): Promise<void> {
  const endpoint_hash = await HashDeviceToken(input.endpoint);
  const { error } = await supabase_client.rpc('ReplacePushSubscription', {
    device_id_input: device_id,
    endpoint_input: input.endpoint,
    endpoint_hash_input: endpoint_hash,
    p256dh_key_input: input.keys.p256dh,
    auth_key_input: input.keys.auth
  });

  if (error !== null) {
    throw new NotificationRepositoryError(
      'Unable to replace push subscription'
    );
  }
}

export async function DeletePushSubscription(
  device_id: string,
  supabase_client: SupabaseClient = ReadSupabaseAdminClient()
): Promise<void> {
  const { error } = await supabase_client.rpc('DeletePushSubscription', {
    device_id_input: device_id
  });

  if (error !== null) {
    throw new NotificationRepositoryError('Unable to delete subscription');
  }
}

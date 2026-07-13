import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { HashDeviceToken } from './device-session';
import { ReadSupabaseAdminClient } from './supabase-admin';

import type {
  BookmarkMutationInput,
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

const BookmarkStateSchema = z.strictObject({
  device_id: z.uuid(),
  anilist_media_id: z.number().int().positive(),
  is_bookmarked: z.boolean(),
  client_mutation_id: z.uuid(),
  client_sequence: z.number().int().positive(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true })
});

const BookmarkListRowSchema = z.strictObject({
  anilist_media_id: z.number().int().positive()
});

export interface NotificationPreferencesResponse {
  readonly is_notification_enabled: boolean;
  readonly notification_mode: NotificationMode;
  readonly is_adult_confirmed: boolean;
  readonly is_adult_content_visible: boolean;
  readonly bookmark_count: number;
}

export interface BookmarkState {
  readonly device_id: string;
  readonly anilist_media_id: number;
  readonly is_bookmarked: boolean;
  readonly client_mutation_id: string;
  readonly client_sequence: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface BookmarkPage {
  readonly anilist_media_ids: readonly number[];
  readonly next_cursor: number | null;
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
  const bookmark_count_request = supabase_client
    .from('anime_bookmark_states')
    .select('anilist_media_id', { count: 'exact', head: true })
    .eq('device_id', device_id)
    .eq('is_bookmarked', true);
  const [preferences_result, bookmark_count_result] = await Promise.all([
    preferences_request,
    bookmark_count_request
  ]);

  if (
    preferences_result.error !== null ||
    bookmark_count_result.error !== null ||
    bookmark_count_result.count === null
  ) {
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
    bookmark_count: bookmark_count_result.count
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

  const bookmark_count_result = await supabase_client
    .from('anime_bookmark_states')
    .select('anilist_media_id', { count: 'exact', head: true })
    .eq('device_id', device_id)
    .eq('is_bookmarked', true);

  if (
    bookmark_count_result.error !== null ||
    bookmark_count_result.count === null
  ) {
    throw new NotificationRepositoryError('Unable to count bookmarks');
  }

  return Object.freeze({
    ...parsed_preferences.data,
    bookmark_count: bookmark_count_result.count
  });
}

export async function ReadBookmarkPage(
  device_id: string,
  cursor: number | undefined,
  limit: number,
  supabase_client: SupabaseClient = ReadSupabaseAdminClient()
): Promise<BookmarkPage> {
  let bookmark_query = supabase_client
    .from('anime_bookmark_states')
    .select('anilist_media_id')
    .eq('device_id', device_id)
    .eq('is_bookmarked', true)
    .order('anilist_media_id', { ascending: true })
    .limit(limit + 1);

  if (cursor !== undefined) {
    bookmark_query = bookmark_query.gt('anilist_media_id', cursor);
  }

  const { data, error } = await bookmark_query;

  if (error !== null) {
    throw new NotificationRepositoryError('Unable to read bookmarks');
  }

  const parsed_rows = z.array(BookmarkListRowSchema).safeParse(data);

  if (!parsed_rows.success) {
    throw new NotificationRepositoryError('Bookmark records are invalid');
  }

  const has_next_page = parsed_rows.data.length > limit;
  const visible_rows = parsed_rows.data.slice(0, limit);

  return Object.freeze({
    anilist_media_ids: Object.freeze(
      visible_rows.map(bookmark_row => bookmark_row.anilist_media_id)
    ),
    next_cursor: has_next_page
      ? (visible_rows.at(-1)?.anilist_media_id ?? null)
      : null
  });
}

export async function WriteBookmarkState(
  device_id: string,
  anilist_media_id: number,
  input: BookmarkMutationInput,
  supabase_client: SupabaseClient = ReadSupabaseAdminClient()
): Promise<BookmarkState> {
  const { data, error } = await supabase_client.rpc('WriteBookmarkState', {
    device_id_input: device_id,
    anilist_media_id_input: anilist_media_id,
    is_bookmarked_input: input.is_bookmarked,
    client_mutation_id_input: input.client_mutation_id,
    client_sequence_input: input.client_sequence
  });

  if (error !== null) {
    throw new NotificationRepositoryError('Unable to write bookmark state');
  }

  const parsed_state = BookmarkStateSchema.safeParse(data);

  if (!parsed_state.success) {
    throw new NotificationRepositoryError('Bookmark state is invalid');
  }

  return Object.freeze(parsed_state.data);
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

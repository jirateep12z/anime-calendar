import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { ReadSupabaseAdminClient } from '@/lib/supabase/server';

import type { BookmarkMutationInput } from '../validation/bookmark-api-schema';

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

export class BookmarkRepositoryError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'BookmarkRepositoryError';
  }
}

export async function ReadBookmarkCount(
  device_id: string,
  supabase_client: SupabaseClient = ReadSupabaseAdminClient()
): Promise<number> {
  const { count, error } = await supabase_client
    .from('anime_bookmark_states')
    .select('anilist_media_id', { count: 'exact', head: true })
    .eq('device_id', device_id)
    .eq('is_bookmarked', true);

  if (error !== null || count === null) {
    throw new BookmarkRepositoryError('Unable to count bookmarks');
  }

  return count;
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
    throw new BookmarkRepositoryError('Unable to read bookmarks');
  }

  const parsed_rows = z.array(BookmarkListRowSchema).safeParse(data);

  if (!parsed_rows.success) {
    throw new BookmarkRepositoryError('Bookmark records are invalid');
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
    throw new BookmarkRepositoryError('Unable to write bookmark state');
  }

  const parsed_state = BookmarkStateSchema.safeParse(data);

  if (!parsed_state.success) {
    throw new BookmarkRepositoryError('Bookmark state is invalid');
  }

  return Object.freeze(parsed_state.data);
}

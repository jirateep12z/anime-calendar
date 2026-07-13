import { z } from 'zod';

import { CreateJsonMutation, RequestApi } from '@/lib/api/client';

import type { BookmarkMutation } from '../types/bookmark';

const BookmarkPageSchema = z.strictObject({
  anilist_media_ids: z.array(z.number().int().positive()),
  next_cursor: z.number().int().positive().nullable()
});

export async function ReadAllBookmarkMediaIds(): Promise<ReadonlySet<number>> {
  const bookmarked_media_ids = new Set<number>();
  let next_cursor: number | null = null;

  do {
    const search_parameters = new URLSearchParams({ limit: '500' });

    if (next_cursor !== null) {
      search_parameters.set('cursor', String(next_cursor));
    }

    const bookmark_page = await RequestApi(
      `/api/anime-bookmarks?${search_parameters}`,
      BookmarkPageSchema
    );

    bookmark_page.anilist_media_ids.forEach(anilist_media_id =>
      bookmarked_media_ids.add(anilist_media_id)
    );
    next_cursor = bookmark_page.next_cursor;
  } while (next_cursor !== null);

  return Object.freeze(bookmarked_media_ids);
}

export async function PutBookmarkState(
  mutation: BookmarkMutation
): Promise<void> {
  await RequestApi(
    `/api/anime-bookmarks/${mutation.anilist_media_id}`,
    z.unknown(),
    CreateJsonMutation('PUT', {
      is_bookmarked: mutation.is_bookmarked,
      client_mutation_id: mutation.client_mutation_id,
      client_sequence: mutation.client_sequence
    })
  );
}

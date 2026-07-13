import type { BookmarkMutation } from '../types/notification';

export function MergeBookmarkState(
  _local_media_ids: ReadonlySet<number>,
  server_media_ids: ReadonlySet<number>,
  pending_mutations: readonly BookmarkMutation[]
): ReadonlySet<number> {
  const merged_media_ids = new Set(server_media_ids);
  const ordered_mutations = pending_mutations.toSorted(
    (left_mutation, right_mutation) =>
      left_mutation.client_sequence - right_mutation.client_sequence
  );

  for (const mutation of ordered_mutations) {
    if (mutation.is_bookmarked) {
      merged_media_ids.add(mutation.anilist_media_id);
    } else {
      merged_media_ids.delete(mutation.anilist_media_id);
    }
  }

  return Object.freeze(merged_media_ids);
}

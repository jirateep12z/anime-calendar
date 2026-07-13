import {
  IsRetryableNotificationError,
  PutBookmarkState
} from '../api/notification-api-client';
import {
  CompleteBookmarkMutation,
  ReadPendingBookmarkMutations
} from '../storage/bookmark-outbox';

export interface OutboxReplayResult {
  readonly completed_count: number;
  readonly blocking_error: unknown | null;
}

let replay_promise: Promise<OutboxReplayResult> | null = null;

async function ReplayPendingBookmarkMutations(): Promise<OutboxReplayResult> {
  const pending_mutations = await ReadPendingBookmarkMutations();
  let completed_count = 0;

  for (const mutation of pending_mutations) {
    try {
      await PutBookmarkState(mutation);
      await CompleteBookmarkMutation(mutation.client_mutation_id);
      completed_count += 1;
    } catch (error) {
      if (IsRetryableNotificationError(error)) {
        break;
      }

      return Object.freeze({ completed_count, blocking_error: error });
    }
  }

  return Object.freeze({ completed_count, blocking_error: null });
}

export function ReplayBookmarkOutbox(): Promise<OutboxReplayResult> {
  if (replay_promise !== null) {
    return replay_promise;
  }

  replay_promise = ReplayPendingBookmarkMutations().finally(() => {
    replay_promise = null;
  });

  return replay_promise;
}

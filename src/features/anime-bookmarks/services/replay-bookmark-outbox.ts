import { IsRetryableApiClientError } from '@/lib/api/client';
import { CreateReplayCoordinator } from '@/lib/replay-coordinator';

import { PutBookmarkState } from '../api/bookmark-api-client';
import {
  CompleteBookmarkMutation,
  ReadPendingBookmarkMutations
} from '../storage/bookmark-outbox';

export interface OutboxReplayResult {
  readonly completed_count: number;
  readonly blocking_error: unknown | null;
}

async function ReplayPendingBookmarkMutations(): Promise<OutboxReplayResult> {
  const pending_mutations = await ReadPendingBookmarkMutations();
  let completed_count = 0;

  for (const mutation of pending_mutations) {
    try {
      await PutBookmarkState(mutation);
      await CompleteBookmarkMutation(mutation.client_mutation_id);
      completed_count += 1;
    } catch (error) {
      if (IsRetryableApiClientError(error)) {
        break;
      }

      return Object.freeze({ completed_count, blocking_error: error });
    }
  }

  return Object.freeze({ completed_count, blocking_error: null });
}

const ReplayCoordinatedBookmarkMutations = CreateReplayCoordinator(
  ReplayPendingBookmarkMutations
);

export function ReplayBookmarkOutbox(): Promise<OutboxReplayResult> {
  return ReplayCoordinatedBookmarkMutations();
}

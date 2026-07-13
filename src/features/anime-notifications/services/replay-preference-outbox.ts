import {
  IsRetryableNotificationError,
  WriteNotificationPreferences
} from '../api/notification-api-client';
import {
  CompletePreferenceMutation,
  ReadPendingPreferenceMutation
} from '../storage/preference-outbox';
import { CreatePreferenceReplayCoordinator } from './create-preference-replay-coordinator';

import type { OutboxReplayResult } from './replay-bookmark-outbox';

async function ReplayPendingPreferenceMutation(): Promise<OutboxReplayResult> {
  const pending_mutation = await ReadPendingPreferenceMutation();

  if (pending_mutation === null) {
    return Object.freeze({ completed_count: 0, blocking_error: null });
  }

  try {
    await WriteNotificationPreferences(pending_mutation.preferences);
    await CompletePreferenceMutation(pending_mutation.client_mutation_id);

    return Object.freeze({ completed_count: 1, blocking_error: null });
  } catch (error) {
    return Object.freeze({
      completed_count: 0,
      blocking_error: IsRetryableNotificationError(error) ? null : error
    });
  }
}

const ReplayCoordinatedPreferenceMutations = CreatePreferenceReplayCoordinator(
  ReplayPendingPreferenceMutation
);

export function ReplayPreferenceOutbox(): Promise<OutboxReplayResult> {
  return ReplayCoordinatedPreferenceMutations();
}

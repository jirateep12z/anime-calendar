import type { OutboxReplayResult } from './replay-bookmark-outbox';

export function CreatePreferenceReplayCoordinator(
  ReplayOnce: () => Promise<OutboxReplayResult>
): () => Promise<OutboxReplayResult> {
  let replay_promise: Promise<OutboxReplayResult> | null = null;
  let is_trailing_replay_requested = false;

  async function ReplayRequestedMutations(): Promise<OutboxReplayResult> {
    let completed_count = 0;
    let blocking_error: unknown | null = null;

    do {
      is_trailing_replay_requested = false;
      const replay_result = await ReplayOnce();

      completed_count += replay_result.completed_count;
      blocking_error = replay_result.blocking_error;
    } while (is_trailing_replay_requested && blocking_error === null);

    return Object.freeze({ completed_count, blocking_error });
  }

  return function Replay(): Promise<OutboxReplayResult> {
    if (replay_promise !== null) {
      is_trailing_replay_requested = true;

      return replay_promise;
    }

    replay_promise = ReplayRequestedMutations().finally(() => {
      replay_promise = null;
    });

    return replay_promise;
  };
}

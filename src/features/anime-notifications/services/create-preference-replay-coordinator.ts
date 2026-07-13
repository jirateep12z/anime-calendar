import { CreateReplayCoordinator } from '@/lib/replay-coordinator';

import type { OutboxReplayResult } from '../types/notification';

export function CreatePreferenceReplayCoordinator(
  ReplayOnce: () => Promise<OutboxReplayResult>
): () => Promise<OutboxReplayResult> {
  return CreateReplayCoordinator(ReplayOnce);
}

import type {
  ClaimedNotificationBatch,
  DeliveryCompletionStatus,
  NotificationBatchResult,
  NotificationDeliveryRecord
} from '../_shared/notification-types.ts';

const MAX_CONCURRENT_PUSHES = 10;

interface DeliveryOutcome extends NotificationBatchResult {}

export interface NotificationBatchDependencies {
  readonly ClaimBatch: (batch_id: string) => Promise<ClaimedNotificationBatch>;
  readonly SendPush: (delivery: NotificationDeliveryRecord) => Promise<void>;
  readonly CompleteDelivery: (
    delivery_id: string,
    claim_token: string,
    status: DeliveryCompletionStatus,
    error_code: string | null
  ) => Promise<DeliveryCompletionStatus>;
  readonly InvalidateSubscription: (subscription_id: string) => Promise<void>;
  readonly CompleteBatch: (
    batch_id: string,
    claim_token: string
  ) => Promise<void>;
}

export class PushRequestError extends Error {
  public readonly http_status: number | null;

  public constructor(http_status: number | null) {
    super('Push request failed');
    this.name = 'PushRequestError';
    this.http_status = http_status;
  }
}

function CreateOutcome(
  status: DeliveryCompletionStatus,
  is_invalidated: boolean
): DeliveryOutcome {
  return Object.freeze({
    sent_count: status === 'SENT' ? 1 : 0,
    invalidated_count: is_invalidated ? 1 : 0,
    retryable_count: status === 'RETRYABLE_FAILED' ? 1 : 0,
    final_failed_count: status === 'FINAL_FAILED' ? 1 : 0
  });
}

function ClassifyPushError(error: unknown): {
  readonly status: DeliveryCompletionStatus;
  readonly error_code: string;
  readonly should_invalidate: boolean;
} {
  const http_status =
    error instanceof PushRequestError ? error.http_status : null;
  if (http_status === 404 || http_status === 410) {
    return {
      status: 'FINAL_FAILED',
      error_code: `PUSH_${http_status}`,
      should_invalidate: true
    };
  }
  if (http_status === null || http_status === 429 || http_status >= 500) {
    return {
      status: 'RETRYABLE_FAILED',
      error_code: http_status === null ? 'PUSH_NETWORK' : `PUSH_${http_status}`,
      should_invalidate: false
    };
  }
  return {
    status: 'FINAL_FAILED',
    error_code: `PUSH_${http_status}`,
    should_invalidate: false
  };
}

async function ProcessDelivery(
  delivery: NotificationDeliveryRecord,
  claim_token: string,
  dependencies: NotificationBatchDependencies
): Promise<DeliveryOutcome> {
  if (delivery.subscription === null) {
    const effective_status = await dependencies.CompleteDelivery(
      delivery.delivery_id,
      claim_token,
      'FINAL_FAILED',
      'SUBSCRIPTION_MISSING'
    );
    return CreateOutcome(effective_status, false);
  }

  try {
    await dependencies.SendPush(delivery);
    const effective_status = await dependencies.CompleteDelivery(
      delivery.delivery_id,
      claim_token,
      'SENT',
      null
    );
    return CreateOutcome(effective_status, false);
  } catch (error) {
    const classification = ClassifyPushError(error);
    if (classification.should_invalidate) {
      await dependencies.InvalidateSubscription(delivery.subscription.id);
    }
    const effective_status = await dependencies.CompleteDelivery(
      delivery.delivery_id,
      claim_token,
      classification.status,
      classification.error_code
    );
    return CreateOutcome(effective_status, classification.should_invalidate);
  }
}

function CombineOutcomes(
  outcomes: readonly DeliveryOutcome[]
): NotificationBatchResult {
  return Object.freeze(
    outcomes.reduce<NotificationBatchResult>(
      (combined_result, outcome) => ({
        sent_count: combined_result.sent_count + outcome.sent_count,
        invalidated_count:
          combined_result.invalidated_count + outcome.invalidated_count,
        retryable_count:
          combined_result.retryable_count + outcome.retryable_count,
        final_failed_count:
          combined_result.final_failed_count + outcome.final_failed_count
      }),
      {
        sent_count: 0,
        invalidated_count: 0,
        retryable_count: 0,
        final_failed_count: 0
      }
    )
  );
}

export async function SendNotificationBatch(
  batch_id: string,
  dependencies: NotificationBatchDependencies
): Promise<NotificationBatchResult> {
  const claimed_batch = await dependencies.ClaimBatch(batch_id);
  const outcomes: DeliveryOutcome[] = [];

  for (
    let delivery_index = 0;
    delivery_index < claimed_batch.deliveries.length;
    delivery_index += MAX_CONCURRENT_PUSHES
  ) {
    const delivery_chunk = claimed_batch.deliveries.slice(
      delivery_index,
      delivery_index + MAX_CONCURRENT_PUSHES
    );
    outcomes.push(
      ...(await Promise.all(
        delivery_chunk.map(delivery =>
          ProcessDelivery(delivery, claimed_batch.claim_token, dependencies)
        )
      ))
    );
  }

  await dependencies.CompleteBatch(batch_id, claimed_batch.claim_token);
  return CombineOutcomes(outcomes);
}

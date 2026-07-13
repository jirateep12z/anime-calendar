export type DeliveryCompletionStatus =
  | "SENT"
  | "RETRYABLE_FAILED"
  | "FINAL_FAILED";

export interface PushSubscriptionRecord {
  readonly id: string;
  readonly endpoint: string;
  readonly p256dh_key: string;
  readonly auth_key: string;
}

export interface NotificationPayload {
  readonly title: string;
  readonly body: string;
  readonly tag: string;
  readonly icon: string;
  readonly image?: string;
  readonly data: {
    readonly url: string;
    readonly anilist_schedule_id: number;
    readonly is_adult: boolean;
  };
}

export interface NotificationDeliveryRecord {
  readonly delivery_id: string;
  readonly subscription: PushSubscriptionRecord | null;
  readonly payload: NotificationPayload;
}

export interface ClaimedNotificationBatch {
  readonly claim_token: string;
  readonly deliveries: readonly NotificationDeliveryRecord[];
}

export interface NotificationBatchResult {
  readonly sent_count: number;
  readonly invalidated_count: number;
  readonly retryable_count: number;
  readonly final_failed_count: number;
}

/// <reference lib="deno.ns" />

import {
  createClient,
  type SupabaseClient,
} from "npm:@supabase/supabase-js@2.110.5";

import {
  CreateWebPushApplicationServer,
  PushNotification,
} from "../_shared/web-push-client.ts";

import type {
  ClaimedNotificationBatch,
  DeliveryCompletionStatus,
  NotificationDeliveryRecord,
  NotificationPayload,
  PushSubscriptionRecord,
} from "../_shared/notification-types.ts";
import type { NotificationBatchDependencies } from "./send-notification-batch.ts";

export interface EdgeEnvironment {
  readonly supabase_url: string;
  readonly supabase_service_role_key: string;
  readonly notification_edge_secret: string;
  readonly vapid_keys_json: string;
  readonly vapid_subject: string;
}

interface DeliveryRow {
  readonly id: string;
  readonly device_id: string;
  readonly anilist_schedule_id: number;
}

interface ReleaseRow {
  readonly anilist_schedule_id: number;
  readonly title: string;
  readonly episode_number: number;
  readonly airing_time_bangkok: string;
  readonly is_adult: boolean;
  readonly cover_image_url: string | null;
}

interface SubscriptionRow extends PushSubscriptionRecord {
  readonly device_id: string;
}

export class NotificationBatchNotFoundError extends Error {
  public constructor() {
    super("Notification batch not found");
    this.name = "NotificationBatchNotFoundError";
  }
}

export class NotificationBatchNotClaimableError extends Error {
  public constructor() {
    super("Notification batch is not claimable");
    this.name = "NotificationBatchNotClaimableError";
  }
}

export class NotificationBatchRepositoryError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "NotificationBatchRepositoryError";
  }
}

function ReadRequiredEnvironmentValue(environment_name: string): string {
  const environment_value = Deno.env.get(environment_name)?.trim() ?? "";
  if (environment_value.length === 0) {
    throw new NotificationBatchRepositoryError(
      `Required environment is missing: ${environment_name}`,
    );
  }
  return environment_value;
}

export function ReadEdgeEnvironment(): EdgeEnvironment {
  const environment = {
    supabase_url: ReadRequiredEnvironmentValue("SUPABASE_URL"),
    supabase_service_role_key: ReadRequiredEnvironmentValue(
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
    notification_edge_secret: ReadRequiredEnvironmentValue(
      "NOTIFICATION_EDGE_SECRET",
    ),
    vapid_keys_json: ReadRequiredEnvironmentValue("VAPID_KEYS_JSON"),
    vapid_subject: ReadRequiredEnvironmentValue("VAPID_SUBJECT"),
  };
  new URL(environment.supabase_url);
  if (
    !environment.vapid_subject.startsWith("mailto:") &&
    !environment.vapid_subject.startsWith("https://")
  ) {
    throw new NotificationBatchRepositoryError("VAPID subject is invalid");
  }
  return Object.freeze(environment);
}

function IsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function ParseDeliveryRows(value: unknown): readonly DeliveryRow[] {
  if (!Array.isArray(value)) {
    throw new NotificationBatchRepositoryError("Delivery rows are invalid");
  }
  return value.map((delivery_row) => {
    if (
      !IsRecord(delivery_row) ||
      typeof delivery_row.id !== "string" ||
      typeof delivery_row.device_id !== "string" ||
      typeof delivery_row.anilist_schedule_id !== "number"
    ) {
      throw new NotificationBatchRepositoryError("Delivery row is invalid");
    }
    return {
      id: delivery_row.id,
      device_id: delivery_row.device_id,
      anilist_schedule_id: delivery_row.anilist_schedule_id,
    };
  });
}

function ParseReleaseRows(value: unknown): readonly ReleaseRow[] {
  if (!Array.isArray(value)) {
    throw new NotificationBatchRepositoryError("Release rows are invalid");
  }
  return value.map((release_row) => {
    if (
      !IsRecord(release_row) ||
      typeof release_row.anilist_schedule_id !== "number" ||
      typeof release_row.title !== "string" ||
      typeof release_row.episode_number !== "number" ||
      typeof release_row.airing_time_bangkok !== "string" ||
      typeof release_row.is_adult !== "boolean" ||
      !(
        release_row.cover_image_url === null ||
        typeof release_row.cover_image_url === "string"
      )
    ) {
      throw new NotificationBatchRepositoryError("Release row is invalid");
    }
    return release_row as unknown as ReleaseRow;
  });
}

function ParseSubscriptionRows(value: unknown): readonly SubscriptionRow[] {
  if (!Array.isArray(value)) {
    throw new NotificationBatchRepositoryError(
      "Subscription rows are invalid",
    );
  }
  return value.map((subscription_row) => {
    if (
      !IsRecord(subscription_row) ||
      typeof subscription_row.id !== "string" ||
      typeof subscription_row.device_id !== "string" ||
      typeof subscription_row.endpoint !== "string" ||
      typeof subscription_row.p256dh_key !== "string" ||
      typeof subscription_row.auth_key !== "string"
    ) {
      throw new NotificationBatchRepositoryError(
        "Subscription row is invalid",
      );
    }
    return subscription_row as unknown as SubscriptionRow;
  });
}

function CreatePayload(release: ReleaseRow): NotificationPayload {
  return Object.freeze({
    title: release.title,
    body: `ตอน ${release.episode_number} • ${release.airing_time_bangkok} น.`,
    tag: `anime-release-${release.anilist_schedule_id}`,
    icon: "/icons/anime-calendar-192.png",
    ...(release.cover_image_url === null
      ? {}
      : { image: release.cover_image_url }),
    data: Object.freeze({
      url: `/calendar/?release=${release.anilist_schedule_id}`,
      anilist_schedule_id: release.anilist_schedule_id,
      is_adult: release.is_adult,
    }),
  });
}

async function ReadClaimedDeliveries(
  supabase_client: SupabaseClient,
  batch_id: string,
  claim_token: string,
): Promise<ClaimedNotificationBatch> {
  const deliveries_result = await supabase_client
    .from("notification_deliveries")
    .select("id, device_id, anilist_schedule_id")
    .eq("batch_id", batch_id)
    .eq("status", "PENDING");
  if (deliveries_result.error !== null) {
    throw new NotificationBatchRepositoryError("Unable to read deliveries");
  }
  const delivery_rows = ParseDeliveryRows(deliveries_result.data);
  if (delivery_rows.length === 0) {
    return Object.freeze({ claim_token, deliveries: Object.freeze([]) });
  }
  const schedule_ids = delivery_rows.map((row) => row.anilist_schedule_id);
  const device_ids = delivery_rows.map((row) => row.device_id);
  const [releases_result, subscriptions_result] = await Promise.all([
    supabase_client
      .from("anime_releases")
      .select(
        "anilist_schedule_id, title, episode_number, airing_time_bangkok, is_adult, cover_image_url",
      )
      .in("anilist_schedule_id", schedule_ids),
    supabase_client
      .from("push_subscriptions")
      .select("id, device_id, endpoint, p256dh_key, auth_key")
      .in("device_id", device_ids)
      .eq("is_active", true),
  ]);
  if (releases_result.error !== null || subscriptions_result.error !== null) {
    throw new NotificationBatchRepositoryError("Unable to compose deliveries");
  }

  const release_by_id = new Map(
    ParseReleaseRows(releases_result.data).map((release) => [
      release.anilist_schedule_id,
      release,
    ]),
  );
  const subscription_by_device_id = new Map(
    ParseSubscriptionRows(subscriptions_result.data).map((subscription) => [
      subscription.device_id,
      subscription,
    ]),
  );
  const deliveries: readonly NotificationDeliveryRecord[] = delivery_rows.map(
    (delivery) => {
      const release = release_by_id.get(delivery.anilist_schedule_id);
      if (release === undefined) {
        throw new NotificationBatchRepositoryError(
          "Delivery release is missing",
        );
      }
      return Object.freeze({
        delivery_id: delivery.id,
        subscription: subscription_by_device_id.get(delivery.device_id) ?? null,
        payload: CreatePayload(release),
      });
    },
  );

  return Object.freeze({ claim_token, deliveries: Object.freeze(deliveries) });
}

export async function CreateProductionDependencies(
  environment: EdgeEnvironment = ReadEdgeEnvironment(),
): Promise<NotificationBatchDependencies> {
  const supabase_client = createClient(
    environment.supabase_url,
    environment.supabase_service_role_key,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  let application_server_promise:
    | ReturnType<
      typeof CreateWebPushApplicationServer
    >
    | null = null;

  const dependencies: NotificationBatchDependencies = {
    ClaimBatch: async (batch_id) => {
      const claim_result = await supabase_client.rpc(
        "ClaimNotificationBatch",
        { batch_id_input: batch_id },
      );
      if (claim_result.error !== null) {
        if (claim_result.error.code === "P0002") {
          throw new NotificationBatchNotFoundError();
        }
        if (claim_result.error.code === "P0001") {
          throw new NotificationBatchNotClaimableError();
        }
        throw new NotificationBatchRepositoryError("Unable to claim batch");
      }
      if (typeof claim_result.data !== "string") {
        throw new NotificationBatchRepositoryError("Claim token is invalid");
      }
      return await ReadClaimedDeliveries(
        supabase_client,
        batch_id,
        claim_result.data,
      );
    },
    SendPush: async (delivery) => {
      if (delivery.subscription === null) {
        throw new NotificationBatchRepositoryError(
          "Cannot send without subscription",
        );
      }
      application_server_promise ??= CreateWebPushApplicationServer(
        environment,
      );
      await PushNotification(
        await application_server_promise,
        delivery.subscription,
        delivery.payload,
      );
    },
    CompleteDelivery: async (
      delivery_id,
      claim_token,
      status,
      error_code,
    ) => {
      const completion_result = await supabase_client.rpc(
        "CompleteNotificationDelivery",
        {
          delivery_id_input: delivery_id,
          claim_token_input: claim_token,
          delivery_status_input: status,
          error_code_input: error_code,
        },
      );
      if (
        completion_result.error !== null ||
        typeof completion_result.data !== "string" ||
        !["SENT", "RETRYABLE_FAILED", "FINAL_FAILED"].includes(
          completion_result.data,
        )
      ) {
        throw new NotificationBatchRepositoryError(
          "Unable to complete delivery",
        );
      }
      return completion_result.data as DeliveryCompletionStatus;
    },
    InvalidateSubscription: async (subscription_id) => {
      const { error } = await supabase_client
        .from("push_subscriptions")
        .update({
          is_active: false,
          invalidated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription_id);
      if (error !== null) {
        throw new NotificationBatchRepositoryError(
          "Unable to invalidate subscription",
        );
      }
    },
    CompleteBatch: async (batch_id, claim_token) => {
      const { error } = await supabase_client.rpc(
        "CompleteNotificationBatch",
        { batch_id_input: batch_id, claim_token_input: claim_token },
      );
      if (error !== null) {
        throw new NotificationBatchRepositoryError(
          "Unable to complete batch",
        );
      }
    },
  };
  return Object.freeze(dependencies);
}

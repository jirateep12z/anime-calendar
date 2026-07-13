import {
  ApplicationServer,
  importVapidKeys,
  PushMessageError,
  Urgency
} from 'jsr:@negrel/webpush@0.5.0';

import { PushRequestError } from '../send-notification-batch/send-notification-batch.ts';

import type {
  NotificationPayload,
  PushSubscriptionRecord
} from './notification-types.ts';

export interface WebPushEnvironment {
  readonly vapid_keys_json: string;
  readonly vapid_subject: string;
}

export async function CreateWebPushApplicationServer(
  environment: WebPushEnvironment
): Promise<ApplicationServer> {
  const exported_vapid_keys = JSON.parse(
    environment.vapid_keys_json
  ) as unknown;
  const vapid_keys = await importVapidKeys(
    exported_vapid_keys as Parameters<typeof importVapidKeys>[0],
    {}
  );
  return await ApplicationServer.new({
    contactInformation: environment.vapid_subject,
    vapidKeys: vapid_keys
  });
}

export async function PushNotification(
  application_server: ApplicationServer,
  subscription: PushSubscriptionRecord,
  payload: NotificationPayload
): Promise<void> {
  try {
    await application_server
      .subscribe({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key
        }
      })
      .pushTextMessage(JSON.stringify(payload), {
        ttl: 300,
        urgency: Urgency.High,
        topic: `release-${payload.data.anilist_schedule_id}`.slice(0, 32)
      });
  } catch (error) {
    if (error instanceof PushMessageError) {
      throw new PushRequestError(error.response.status);
    }
    throw new PushRequestError(null);
  }
}

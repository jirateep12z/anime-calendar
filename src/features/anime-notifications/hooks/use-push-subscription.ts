'use client';

import { useCallback } from 'react';

import {
  DeletePushSubscription,
  NotificationClientError,
  WritePushSubscription
} from '../api/notification-api-client';
import { DecodeVapidPublicKey, ReadPublicVapidKey } from '../utils/vapid-key';

import type { PushSubscriptionInput } from '../validation/notification-api-schema';

function ParsePushSubscription(
  subscription: PushSubscription
): PushSubscriptionInput {
  const serialized_subscription = subscription.toJSON();

  if (
    !serialized_subscription.endpoint ||
    !serialized_subscription.keys?.p256dh ||
    !serialized_subscription.keys.auth
  ) {
    throw new NotificationClientError(
      'PUSH_SUBSCRIPTION_FAILED',
      'เบราว์เซอร์ส่งข้อมูล Push subscription ไม่ครบ'
    );
  }

  return {
    endpoint: serialized_subscription.endpoint,
    keys: {
      p256dh: serialized_subscription.keys.p256dh,
      auth: serialized_subscription.keys.auth
    }
  };
}

function AreApplicationServerKeysEqual(
  current_key: ArrayBuffer | null,
  expected_key: Uint8Array<ArrayBuffer>
): boolean {
  if (current_key === null) return false;

  const current_key_bytes = new Uint8Array(current_key);

  return (
    current_key_bytes.byteLength === expected_key.byteLength &&
    current_key_bytes.every(
      (current_byte, byte_index) => current_byte === expected_key[byte_index]
    )
  );
}

async function ReadOrReplacePushSubscription(
  registration: ServiceWorkerRegistration,
  application_server_key: Uint8Array<ArrayBuffer>
): Promise<PushSubscription> {
  const existing_subscription =
    await registration.pushManager.getSubscription();

  if (
    existing_subscription !== null &&
    AreApplicationServerKeysEqual(
      existing_subscription.options.applicationServerKey,
      application_server_key
    )
  ) {
    return existing_subscription;
  }

  if (existing_subscription !== null) {
    const is_unsubscribed = await existing_subscription.unsubscribe();

    if (!is_unsubscribed) {
      throw new NotificationClientError(
        'PUSH_SUBSCRIPTION_FAILED',
        'ไม่สามารถเปลี่ยน Public Push key ของเบราว์เซอร์ได้'
      );
    }
  }

  return await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: application_server_key
  });
}

export async function SubscribeToPush(): Promise<PushSubscription> {
  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    throw new NotificationClientError(
      'PERMISSION_DENIED',
      'ไม่ได้รับอนุญาตให้ส่งการแจ้งเตือน'
    );
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const application_server_key = DecodeVapidPublicKey(ReadPublicVapidKey());
    const push_subscription = await ReadOrReplacePushSubscription(
      registration,
      application_server_key
    );

    await WritePushSubscription(ParsePushSubscription(push_subscription));

    return push_subscription;
  } catch (error) {
    if (error instanceof NotificationClientError) {
      throw error;
    }

    throw new NotificationClientError(
      'PUSH_SUBSCRIPTION_FAILED',
      'สมัครรับ Push notification ไม่สำเร็จ',
      null,
      error
    );
  }
}

export async function UnsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const push_subscription = await registration.pushManager.getSubscription();

  await push_subscription?.unsubscribe();

  try {
    await DeletePushSubscription();
  } catch (error) {
    throw new NotificationClientError(
      'PARTIAL_UNSUBSCRIBE_FAILED',
      'ปิด Push ในเบราว์เซอร์แล้ว แต่ยังลบข้อมูลบนเซิร์ฟเวอร์ไม่สำเร็จ',
      null,
      error
    );
  }
}

export async function HasPushSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    return (await registration.pushManager.getSubscription()) !== null;
  } catch {
    return false;
  }
}

export function UsePushSubscription() {
  const Subscribe = useCallback(() => SubscribeToPush(), []);
  const Unsubscribe = useCallback(() => UnsubscribeFromPush(), []);
  const ReadHasSubscription = useCallback(() => HasPushSubscription(), []);

  return Object.freeze({ Subscribe, Unsubscribe, ReadHasSubscription });
}

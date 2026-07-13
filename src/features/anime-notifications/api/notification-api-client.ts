import { z } from 'zod';

import { CreateJsonMutation, RequestApi } from '@/lib/api/client';

import type { NotificationPreferences } from '../types/notification';
import type { PushSubscriptionInput } from '../validation/notification-api-schema';

const NotificationPreferencesResponseSchema = z.strictObject({
  is_notification_enabled: z.boolean(),
  notification_mode: z.enum(['ALL', 'BOOKMARKS']),
  is_adult_confirmed: z.boolean(),
  is_adult_content_visible: z.boolean(),
  bookmark_count: z.number().int().nonnegative()
});
const PushSubscriptionResponseSchema = z.strictObject({
  is_subscribed: z.boolean()
});

export async function ReadNotificationPreferences(): Promise<
  NotificationPreferences & { readonly bookmark_count: number }
> {
  return RequestApi(
    '/api/notification-preferences',
    NotificationPreferencesResponseSchema
  );
}

export async function WriteNotificationPreferences(
  preferences: NotificationPreferences
): Promise<NotificationPreferences & { readonly bookmark_count: number }> {
  return RequestApi(
    '/api/notification-preferences',
    NotificationPreferencesResponseSchema,
    CreateJsonMutation('PATCH', preferences)
  );
}

export async function WritePushSubscription(
  push_subscription: PushSubscriptionInput
): Promise<void> {
  await RequestApi(
    '/api/push-subscriptions',
    PushSubscriptionResponseSchema,
    CreateJsonMutation('POST', push_subscription)
  );
}

export async function DeletePushSubscription(): Promise<void> {
  await RequestApi(
    '/api/push-subscriptions',
    PushSubscriptionResponseSchema,
    CreateJsonMutation('DELETE', {})
  );
}

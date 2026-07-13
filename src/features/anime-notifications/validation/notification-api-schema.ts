import { z } from 'zod';

const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;

export const NotificationModeSchema = z.enum(['ALL', 'BOOKMARKS']);

export const NotificationPreferencesMutationSchema = z
  .strictObject({
    is_notification_enabled: z.boolean(),
    notification_mode: NotificationModeSchema,
    is_adult_confirmed: z.boolean(),
    is_adult_content_visible: z.boolean()
  })
  .superRefine((preferences, refinement_context) => {
    if (
      preferences.is_adult_content_visible &&
      !preferences.is_adult_confirmed
    ) {
      refinement_context.addIssue({
        code: 'custom',
        path: ['is_adult_content_visible'],
        message: 'Adult content visibility requires confirmation'
      });
    }
  });

export const BookmarkMutationSchema = z.strictObject({
  is_bookmarked: z.boolean(),
  client_mutation_id: z.uuid(),
  client_sequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
});

export const BookmarkRouteParameterSchema = z.coerce.number().int().positive();

export const BookmarkQuerySchema = z.strictObject({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200)
});

export const PushSubscriptionSchema = z.strictObject({
  endpoint: z
    .url()
    .max(2_048)
    .refine(endpoint => endpoint.startsWith('https://'), {
      message: 'Push endpoint must use HTTPS'
    }),
  keys: z.strictObject({
    p256dh: z.string().min(40).max(200).regex(BASE64_URL_PATTERN),
    auth: z.string().min(16).max(100).regex(BASE64_URL_PATTERN)
  })
});

export type NotificationMode = z.infer<typeof NotificationModeSchema>;
export type NotificationPreferencesMutation = z.infer<
  typeof NotificationPreferencesMutationSchema
>;
export type BookmarkMutationInput = z.infer<typeof BookmarkMutationSchema>;
export type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>;

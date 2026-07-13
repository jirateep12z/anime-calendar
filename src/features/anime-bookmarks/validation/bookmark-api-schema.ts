import { z } from 'zod';

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

export type BookmarkMutationInput = z.infer<typeof BookmarkMutationSchema>;

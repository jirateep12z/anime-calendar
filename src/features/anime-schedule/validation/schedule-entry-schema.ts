import { z } from 'zod';

import { NormalizeHttpUrl } from '../utils/external-url';

const NullableHttpUrlSchema = z
  .string()
  .nullable()
  .refine(
    candidate_url =>
      NormalizeHttpUrl(candidate_url) !== null || candidate_url === null
  );

export const ScheduleEntrySchema = z.object({
  public_id: z.string().min(1),
  anilist_schedule_id: z.number().int().positive(),
  anilist_media_id: z.number().int().positive(),
  title: z.object({
    primary: z.string().min(1),
    english: z.string().nullable(),
    romaji: z.string().nullable(),
    native: z.string().nullable()
  }),
  description: z.string().nullable().optional().default(null),
  cover_image_url: NullableHttpUrlSchema,
  episode_number: z.number().int().positive(),
  total_episodes: z.number().int().positive().nullable(),
  format: z.enum(['TV', 'ONA']),
  airing_at: z.number().int().positive(),
  airing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  airing_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration_minutes: z.number().int().positive(),
  ends_at: z.number().int().positive(),
  is_adult: z.boolean(),
  genres: z.array(z.string()),
  average_score: z.number().min(0).max(100).nullable(),
  popularity: z.number().int().nonnegative().nullable(),
  anilist_url: NullableHttpUrlSchema
});

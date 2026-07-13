import { z } from 'zod';

export const AniListTitleSchema = z.object({
  english: z.string().nullable(),
  romaji: z.string().nullable(),
  native: z.string().nullable()
});

export const AniListAiringScheduleSchema = z.object({
  id: z.number().int().positive(),
  airing_at: z.number().int().positive(),
  episode: z.number().int().positive(),
  media: z.object({
    id: z.number().int().positive(),
    title: AniListTitleSchema,
    description: z.string().nullable().optional(),
    cover_image: z
      .object({
        large: z.string().nullable()
      })
      .nullable(),
    format: z.string().nullable(),
    duration_minutes: z.number().int().nullable(),
    total_episodes: z.number().int().positive().nullable(),
    is_adult: z.boolean(),
    genres: z.array(z.string()),
    average_score: z.number().min(0).max(100).nullable(),
    popularity: z.number().int().nonnegative().nullable(),
    site_url: z.string().nullable()
  })
});

export type AniListTitle = z.infer<typeof AniListTitleSchema>;
export type AniListAiringSchedule = z.infer<typeof AniListAiringScheduleSchema>;

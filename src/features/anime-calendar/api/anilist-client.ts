import { z } from 'zod';

import { AniListRequestError } from './anilist-errors';

import type {
  BookmarkCatalogEntry,
  BookmarkMediaStatus
} from '@/features/anime-notifications/types/notification';
import type { AnimeSearchPage, AnimeSearchResult } from '../types/anime-search';
import type { ScheduleRange } from '../types/schedule';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
const PAGE_SIZE = 50;
const SEARCH_PAGE_SIZE = 20;
const BOOKMARK_CATALOG_PAGE_SIZE = 50;
const MAX_PAGE_COUNT = 20;
const REQUEST_TIMEOUT_MILLISECONDS = 12_000;
const RETRY_DELAYS_MILLISECONDS = [1_000, 3_000] as const;

const ANILIST_SCHEDULE_QUERY = `
  query AnimeCalendarSchedule(
    $page: Int!
    $per_page: Int!
    $airing_at_greater: Int!
    $airing_at_lesser: Int!
  ) {
    page: Page(page: $page, perPage: $per_page) {
      page_info: pageInfo {
        current_page: currentPage
        has_next_page: hasNextPage
      }
      airing_schedules: airingSchedules(
        airingAt_greater: $airing_at_greater
        airingAt_lesser: $airing_at_lesser
        sort: TIME
      ) {
        id
        airing_at: airingAt
        episode
        media {
          id
          title { english romaji native }
          description(asHtml: false)
          cover_image: coverImage { large }
          format
          duration_minutes: duration
          total_episodes: episodes
          is_adult: isAdult
          genres
          average_score: averageScore
          popularity
          site_url: siteUrl
        }
      }
    }
  }
`;

const ANILIST_ANIME_SEARCH_QUERY = `
  query AnimeCatalogSearch(
    $search: String!
    $page: Int!
    $per_page: Int!
  ) {
    page: Page(page: $page, perPage: $per_page) {
      page_info: pageInfo {
        current_page: currentPage
        has_next_page: hasNextPage
        total_results: total
      }
      results: media(
        search: $search
        type: ANIME
        sort: SEARCH_MATCH
      ) {
        id
        title { english romaji native }
        cover_image: coverImage { large }
        format
        episode_count: episodes
        duration_minutes: duration
        description(asHtml: false)
        genres
        average_score: averageScore
        popularity
        is_adult: isAdult
        anilist_url: siteUrl
      }
    }
  }
`;

const ANILIST_BOOKMARK_CATALOG_QUERY = `
  query BookmarkCatalog($media_ids: [Int]) {
    page: Page(page: 1, perPage: 50) {
      media(type: ANIME, id_in: $media_ids) {
        id
        title { english romaji native }
        description(asHtml: false)
        cover_image: coverImage { large }
        format
        total_episodes: episodes
        duration_minutes: duration
        status
        is_adult: isAdult
        genres
        average_score: averageScore
        popularity
        anilist_url: siteUrl
        next_airing_episode: nextAiringEpisode { id airing_at: airingAt episode }
      }
    }
  }
`;

const AniListPageSchema = z.object({
  data: z.object({
    page: z.object({
      page_info: z.object({
        current_page: z.number().int().positive(),
        has_next_page: z.boolean()
      }),
      airing_schedules: z.array(z.unknown())
    })
  })
});

const AniListAnimeSearchPageSchema = z.object({
  data: z.object({
    page: z.object({
      page_info: z.object({
        current_page: z.number().int().positive(),
        has_next_page: z.boolean(),
        total_results: z.number().int().nonnegative().nullable()
      }),
      results: z.array(
        z.object({
          id: z.number().int().positive(),
          title: z.object({
            english: z.string().nullable(),
            romaji: z.string().nullable(),
            native: z.string().nullable()
          }),
          cover_image: z.object({ large: z.string().nullable() }).nullable(),
          format: z.string().nullable(),
          episode_count: z.number().int().positive().nullable(),
          duration_minutes: z.number().int().positive().nullable(),
          description: z.string().nullable(),
          genres: z.array(z.string()),
          average_score: z.number().min(0).max(100).nullable(),
          popularity: z.number().int().nonnegative().nullable(),
          is_adult: z.boolean(),
          anilist_url: z.string().nullable()
        })
      )
    })
  })
});

const AniListBookmarkCatalogSchema = z.object({
  data: z.object({
    page: z.object({
      media: z.array(
        z.object({
          id: z.number().int().positive(),
          title: z.object({
            english: z.string().nullable(),
            romaji: z.string().nullable(),
            native: z.string().nullable()
          }),
          description: z.string().nullable(),
          cover_image: z.object({ large: z.string().nullable() }).nullable(),
          format: z.string().nullable(),
          total_episodes: z.number().int().positive().nullable(),
          duration_minutes: z.number().int().positive().nullable(),
          status: z.string().nullable(),
          is_adult: z.boolean(),
          genres: z.array(z.string()),
          average_score: z.number().min(0).max(100).nullable(),
          popularity: z.number().int().nonnegative().nullable(),
          anilist_url: z.string().nullable(),
          next_airing_episode: z
            .object({
              id: z.number().int().positive(),
              airing_at: z.number().int().positive(),
              episode: z.number().int().positive()
            })
            .nullable()
        })
      )
    })
  })
});

const GraphQLErrorResponseSchema = z.object({
  errors: z.array(z.unknown()).min(1)
});

interface AniListRequestBody {
  readonly query: string;
  readonly variables: {
    readonly page: number;
    readonly per_page: number;
    readonly airing_at_greater: number;
    readonly airing_at_lesser: number;
  };
}

interface AniListAnimeSearchRequestBody {
  readonly query: string;
  readonly variables: {
    readonly search: string;
    readonly page: number;
    readonly per_page: number;
  };
}

interface AniListBookmarkCatalogRequestBody {
  readonly query: string;
  readonly variables: {
    readonly media_ids: readonly number[];
  };
}

const BOOKMARK_MEDIA_STATUSES = new Set([
  'RELEASING',
  'FINISHED',
  'NOT_YET_RELEASED',
  'CANCELLED',
  'HIATUS'
]);

function ThrowIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw signal.reason ?? new DOMException('Request cancelled', 'AbortError');
  }
}

function WaitForRetry(
  delay_milliseconds: number,
  signal: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const HandleAbort = () => {
      clearTimeout(timeout_id);
      reject(
        signal.reason ?? new DOMException('Request cancelled', 'AbortError')
      );
    };
    const timeout_id = setTimeout(() => {
      signal.removeEventListener('abort', HandleAbort);
      resolve();
    }, delay_milliseconds);

    signal.addEventListener('abort', HandleAbort, { once: true });
  });
}

function IsRetryableError(error: unknown): boolean {
  return (
    error instanceof AniListRequestError &&
    (error.error_code === 'NETWORK' || error.error_code === 'SERVER')
  );
}

function CreateRequestBody(
  range: ScheduleRange,
  page: number
): AniListRequestBody {
  return {
    query: ANILIST_SCHEDULE_QUERY,
    variables: {
      page,
      per_page: PAGE_SIZE,
      airing_at_greater: range.range_start - 1,
      airing_at_lesser: range.range_end + 1
    }
  };
}

async function ParseResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AniListRequestError(
      'INVALID_RESPONSE',
      'AniList response is not valid JSON',
      response.status
    );
  }
}

async function RequestPage(
  range: ScheduleRange,
  page: number,
  caller_signal: AbortSignal
): Promise<z.infer<typeof AniListPageSchema>['data']['page']> {
  ThrowIfAborted(caller_signal);
  const timeout_signal = AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS);
  const request_signal = AbortSignal.any([caller_signal, timeout_signal]);
  let response: Response;

  try {
    response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(CreateRequestBody(range, page)),
      signal: request_signal
    });
  } catch (error) {
    ThrowIfAborted(caller_signal);

    throw new AniListRequestError(
      'NETWORK',
      error instanceof Error ? error.message : 'AniList network request failed'
    );
  }

  if (!response.ok) {
    const error_code =
      response.status === 429
        ? 'RATE_LIMIT'
        : response.status >= 500
          ? 'SERVER'
          : 'CLIENT';

    throw new AniListRequestError(
      error_code,
      `AniList HTTP request failed with status ${response.status}`,
      response.status
    );
  }

  const response_body = await ParseResponse(response);

  if (GraphQLErrorResponseSchema.safeParse(response_body).success) {
    throw new AniListRequestError(
      'GRAPHQL',
      'AniList returned GraphQL errors',
      response.status
    );
  }

  const parsed_response = AniListPageSchema.safeParse(response_body);

  if (!parsed_response.success) {
    throw new AniListRequestError(
      'INVALID_RESPONSE',
      'AniList response structure is invalid',
      response.status
    );
  }

  return parsed_response.data.data.page;
}

async function RequestPageWithRetry(
  range: ScheduleRange,
  page: number,
  signal: AbortSignal
): Promise<z.infer<typeof AniListPageSchema>['data']['page']> {
  let retry_index = 0;

  while (true) {
    try {
      return await RequestPage(range, page, signal);
    } catch (error) {
      if (
        !IsRetryableError(error) ||
        retry_index >= RETRY_DELAYS_MILLISECONDS.length
      ) {
        throw error;
      }

      await WaitForRetry(RETRY_DELAYS_MILLISECONDS[retry_index], signal);
      retry_index += 1;
    }
  }
}

function CreateAnimeSearchRequestBody(
  search_query: string,
  page: number
): AniListAnimeSearchRequestBody {
  return {
    query: ANILIST_ANIME_SEARCH_QUERY,
    variables: {
      search: search_query,
      page,
      per_page: SEARCH_PAGE_SIZE
    }
  };
}

async function RequestAnimeSearchPage(
  search_query: string,
  page: number,
  caller_signal: AbortSignal
): Promise<AnimeSearchPage> {
  ThrowIfAborted(caller_signal);
  const timeout_signal = AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS);
  const request_signal = AbortSignal.any([caller_signal, timeout_signal]);
  let response: Response;

  try {
    response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(CreateAnimeSearchRequestBody(search_query, page)),
      signal: request_signal
    });
  } catch (error) {
    ThrowIfAborted(caller_signal);

    throw new AniListRequestError(
      'NETWORK',
      error instanceof Error ? error.message : 'AniList network request failed'
    );
  }

  if (!response.ok) {
    const error_code =
      response.status === 429
        ? 'RATE_LIMIT'
        : response.status >= 500
          ? 'SERVER'
          : 'CLIENT';

    throw new AniListRequestError(
      error_code,
      `AniList HTTP request failed with status ${response.status}`,
      response.status
    );
  }

  const response_body = await ParseResponse(response);

  if (GraphQLErrorResponseSchema.safeParse(response_body).success) {
    throw new AniListRequestError(
      'GRAPHQL',
      'AniList returned GraphQL errors',
      response.status
    );
  }

  const parsed_response = AniListAnimeSearchPageSchema.safeParse(response_body);

  if (!parsed_response.success) {
    throw new AniListRequestError(
      'INVALID_RESPONSE',
      'AniList search response structure is invalid',
      response.status
    );
  }

  const { page: response_page } = parsed_response.data.data;

  if (response_page.page_info.current_page !== page) {
    throw new AniListRequestError(
      'INVALID_RESPONSE',
      'AniList search pagination did not advance as requested'
    );
  }

  const results: readonly AnimeSearchResult[] = response_page.results.map(
    result => ({
      anilist_media_id: result.id,
      title: {
        primary:
          result.title.english ??
          result.title.romaji ??
          result.title.native ??
          `Anime ${result.id}`,
        english: result.title.english,
        romaji: result.title.romaji,
        native: result.title.native
      },
      cover_image_url: result.cover_image?.large ?? null,
      format: result.format,
      episode_count: result.episode_count,
      duration_minutes: result.duration_minutes,
      description: result.description,
      genres: result.genres,
      average_score: result.average_score,
      popularity: result.popularity,
      is_adult: result.is_adult,
      anilist_url: result.anilist_url
    })
  );

  return {
    results: Object.freeze(results),
    has_next_page: response_page.page_info.has_next_page,
    total_results: response_page.page_info.total_results
  };
}

async function RequestAnimeSearchPageWithRetry(
  search_query: string,
  page: number,
  signal: AbortSignal
): Promise<AnimeSearchPage> {
  let retry_index = 0;

  while (true) {
    try {
      return await RequestAnimeSearchPage(search_query, page, signal);
    } catch (error) {
      if (
        !IsRetryableError(error) ||
        retry_index >= RETRY_DELAYS_MILLISECONDS.length
      ) {
        throw error;
      }

      await WaitForRetry(RETRY_DELAYS_MILLISECONDS[retry_index], signal);
      retry_index += 1;
    }
  }
}

export async function FetchAniListSchedule(
  range: ScheduleRange,
  signal: AbortSignal
): Promise<readonly unknown[]> {
  const raw_schedules: unknown[] = [];
  let requested_page = 1;

  while (requested_page <= MAX_PAGE_COUNT) {
    const page = await RequestPageWithRetry(range, requested_page, signal);

    if (page.page_info.current_page !== requested_page) {
      throw new AniListRequestError(
        'INVALID_RESPONSE',
        'AniList pagination did not advance as requested'
      );
    }

    raw_schedules.push(...page.airing_schedules);

    if (!page.page_info.has_next_page) {
      return Object.freeze(raw_schedules);
    }

    requested_page += 1;
  }

  throw new AniListRequestError(
    'PAGINATION_LIMIT',
    `AniList exceeded the maximum page count of ${MAX_PAGE_COUNT}`
  );
}

export function FetchAniListAnimeSearch(
  search_query: string,
  signal: AbortSignal
): Promise<AnimeSearchPage> {
  return RequestAnimeSearchPageWithRetry(search_query.trim(), 1, signal);
}

function CreateBookmarkCatalogRequestBody(
  anilist_media_ids: readonly number[]
): AniListBookmarkCatalogRequestBody {
  return {
    query: ANILIST_BOOKMARK_CATALOG_QUERY,
    variables: { media_ids: anilist_media_ids }
  };
}

function ParseBookmarkMediaStatus(
  media_status: string | null
): BookmarkMediaStatus {
  return media_status !== null && BOOKMARK_MEDIA_STATUSES.has(media_status)
    ? (media_status as Exclude<BookmarkMediaStatus, null>)
    : null;
}

async function RequestBookmarkCatalog(
  anilist_media_ids: readonly number[],
  caller_signal: AbortSignal
): Promise<readonly BookmarkCatalogEntry[]> {
  ThrowIfAborted(caller_signal);
  const request_signal = AbortSignal.any([
    caller_signal,
    AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS)
  ]);
  let response: Response;

  try {
    response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(CreateBookmarkCatalogRequestBody(anilist_media_ids)),
      signal: request_signal
    });
  } catch (error) {
    ThrowIfAborted(caller_signal);

    throw new AniListRequestError(
      'NETWORK',
      error instanceof Error ? error.message : 'AniList network request failed'
    );
  }

  if (!response.ok) {
    const error_code =
      response.status === 429
        ? 'RATE_LIMIT'
        : response.status >= 500
          ? 'SERVER'
          : 'CLIENT';

    throw new AniListRequestError(
      error_code,
      `AniList HTTP request failed with status ${response.status}`,
      response.status
    );
  }

  const response_body = await ParseResponse(response);

  if (GraphQLErrorResponseSchema.safeParse(response_body).success) {
    throw new AniListRequestError(
      'GRAPHQL',
      'AniList returned GraphQL errors',
      response.status
    );
  }

  const parsed_response = AniListBookmarkCatalogSchema.safeParse(response_body);

  if (!parsed_response.success) {
    throw new AniListRequestError(
      'INVALID_RESPONSE',
      'AniList bookmark catalog response structure is invalid',
      response.status
    );
  }

  const updated_at = Date.now();

  return Object.freeze(
    parsed_response.data.data.page.media.map(media =>
      Object.freeze({
        anilist_media_id: media.id,
        title: Object.freeze({
          primary:
            media.title.english ??
            media.title.romaji ??
            media.title.native ??
            `Anime ${media.id}`,
          english: media.title.english,
          romaji: media.title.romaji,
          native: media.title.native
        }),
        description: media.description,
        cover_image_url: media.cover_image?.large ?? null,
        format: media.format,
        total_episodes: media.total_episodes,
        duration_minutes: media.duration_minutes,
        media_status: ParseBookmarkMediaStatus(media.status),
        is_adult: media.is_adult,
        genres: Object.freeze(media.genres),
        average_score: media.average_score,
        popularity: media.popularity,
        anilist_url: media.anilist_url,
        latest_schedule_entry: null,
        updated_at
      })
    )
  );
}

export async function FetchAniListMediaCatalog(
  anilist_media_ids: readonly number[],
  signal: AbortSignal
): Promise<readonly BookmarkCatalogEntry[]> {
  if (
    anilist_media_ids.length === 0 ||
    anilist_media_ids.length > BOOKMARK_CATALOG_PAGE_SIZE ||
    anilist_media_ids.some(
      anilist_media_id =>
        !Number.isSafeInteger(anilist_media_id) || anilist_media_id <= 0
    )
  ) {
    throw new RangeError(
      'AniList media IDs must contain 1 to 50 positive IDs.'
    );
  }

  let retry_index = 0;

  while (true) {
    try {
      return await RequestBookmarkCatalog(anilist_media_ids, signal);
    } catch (error) {
      if (
        !IsRetryableError(error) ||
        retry_index >= RETRY_DELAYS_MILLISECONDS.length
      ) {
        throw error;
      }

      await WaitForRetry(RETRY_DELAYS_MILLISECONDS[retry_index], signal);
      retry_index += 1;
    }
  }
}

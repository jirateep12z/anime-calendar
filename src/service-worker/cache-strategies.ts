import {
  APP_SHELL_CACHE,
  IMAGE_CACHE,
  IMAGE_METADATA_CACHE,
  STATIC_CACHE
} from './cache-names';

const CALENDAR_SHELL_URL = '/calendar/';
const OFFLINE_FALLBACK_URL = '/offline/';
const IMAGE_METADATA_ORIGIN = 'https://anime-calendar-cache.invalid';
const IMAGE_CACHE_MAX_ENTRIES = 200;
const IMAGE_CACHE_MAX_AGE_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

interface CacheStrategyDependencies {
  readonly FetchRequest: (request: Request) => Promise<Response>;
  readonly OpenCache: (cache_name: string) => Promise<Cache>;
  readonly ReadNowMilliseconds: () => number;
  readonly Defer: (pending_operation: Promise<unknown>) => void;
}

const DEFAULT_DEPENDENCIES: CacheStrategyDependencies = Object.freeze({
  FetchRequest: (request: Request) => fetch(request),
  OpenCache: (cache_name: string) => caches.open(cache_name),
  ReadNowMilliseconds: () => Date.now(),
  Defer: () => undefined
});

function ShouldCacheResponse(network_response: Response): boolean {
  return network_response.ok || network_response.type === 'opaque';
}

export function CreateImageMetadataRequest(request: Request): Request {
  const metadata_url = new URL('/image-cache-entry', IMAGE_METADATA_ORIGIN);

  metadata_url.searchParams.set('request_url', request.url);

  return new Request(metadata_url);
}

async function WriteImageCacheMetadata(
  request: Request,
  cached_at_milliseconds: number,
  metadata_cache: Cache
): Promise<void> {
  await metadata_cache.put(
    CreateImageMetadataRequest(request),
    new Response(String(cached_at_milliseconds))
  );
}

export async function CleanupImageCache(
  image_cache: Cache,
  metadata_cache: Cache,
  now_milliseconds: number
): Promise<void> {
  const cached_requests = await image_cache.keys();
  const cache_entries = await Promise.all(
    cached_requests.map(async cached_request => {
      const metadata_response = await metadata_cache.match(
        CreateImageMetadataRequest(cached_request)
      );
      const cached_at_milliseconds = Number(
        (await metadata_response?.text()) ?? 0
      );

      return Object.freeze({ cached_request, cached_at_milliseconds });
    })
  );
  const valid_entries = cache_entries
    .filter(
      ({ cached_at_milliseconds }) =>
        cached_at_milliseconds > 0 &&
        now_milliseconds - cached_at_milliseconds <=
          IMAGE_CACHE_MAX_AGE_MILLISECONDS
    )
    .toSorted(
      (left_entry, right_entry) =>
        right_entry.cached_at_milliseconds - left_entry.cached_at_milliseconds
    );
  const retained_request_urls = new Set(
    valid_entries
      .slice(0, IMAGE_CACHE_MAX_ENTRIES)
      .map(({ cached_request }) => cached_request.url)
  );
  const entries_to_delete = cache_entries.filter(
    ({ cached_request }) => !retained_request_urls.has(cached_request.url)
  );

  await Promise.all(
    entries_to_delete.flatMap(({ cached_request }) => [
      image_cache.delete(cached_request),
      metadata_cache.delete(CreateImageMetadataRequest(cached_request))
    ])
  );
}

async function RefreshImageCache(
  request: Request,
  dependencies: CacheStrategyDependencies
): Promise<Response> {
  const network_response = await dependencies.FetchRequest(request);

  if (!ShouldCacheResponse(network_response)) {
    return network_response;
  }

  const [image_cache, metadata_cache] = await Promise.all([
    dependencies.OpenCache(IMAGE_CACHE),
    dependencies.OpenCache(IMAGE_METADATA_CACHE)
  ]);
  const cached_at_milliseconds = dependencies.ReadNowMilliseconds();

  await Promise.all([
    image_cache.put(request, network_response.clone()),
    WriteImageCacheMetadata(request, cached_at_milliseconds, metadata_cache)
  ]);
  await CleanupImageCache(image_cache, metadata_cache, cached_at_milliseconds);

  return network_response;
}

export async function HandleNavigation(
  request: Request,
  dependencies: CacheStrategyDependencies = DEFAULT_DEPENDENCIES
): Promise<Response> {
  async function ReadFallbackResponse(): Promise<Response> {
    const app_shell_cache = await dependencies.OpenCache(APP_SHELL_CACHE);
    const cached_response =
      (await app_shell_cache.match(CALENDAR_SHELL_URL)) ??
      (await app_shell_cache.match(OFFLINE_FALLBACK_URL));
    const fallback_response =
      cached_response ??
      new Response('Offline fallback is unavailable.', { status: 503 });

    return new Response(fallback_response.clone().body, {
      status: fallback_response.status,
      statusText: fallback_response.statusText,
      headers: fallback_response.headers
    });
  }

  try {
    const network_response = await dependencies.FetchRequest(request);

    if (!network_response.ok) {
      return await ReadFallbackResponse();
    }

    const request_url = new URL(request.url);

    if (request_url.pathname.startsWith('/calendar')) {
      const app_shell_cache = await dependencies.OpenCache(APP_SHELL_CACHE);

      await app_shell_cache.put(CALENDAR_SHELL_URL, network_response.clone());
    }

    return network_response;
  } catch {
    return await ReadFallbackResponse();
  }
}

export async function HandleStaticAsset(
  request: Request,
  dependencies: CacheStrategyDependencies = DEFAULT_DEPENDENCIES
): Promise<Response> {
  const static_cache = await dependencies.OpenCache(STATIC_CACHE);
  const cached_response = await static_cache.match(request);

  if (cached_response) {
    return cached_response;
  }

  const network_response = await dependencies.FetchRequest(request);

  if (network_response.ok) {
    await static_cache.put(request, network_response.clone());
  }

  return network_response;
}

export async function HandleImage(
  request: Request,
  dependencies: CacheStrategyDependencies = DEFAULT_DEPENDENCIES
): Promise<Response> {
  const image_cache = await dependencies.OpenCache(IMAGE_CACHE);
  const cached_response = await image_cache.match(request);

  if (cached_response) {
    dependencies.Defer(RefreshImageCache(request, dependencies));

    return cached_response;
  }

  return RefreshImageCache(request, dependencies);
}

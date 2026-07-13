export type CacheRoute = 'NAVIGATION' | 'STATIC' | 'IMAGE' | 'BYPASS';

const HTML_ACCEPT_TYPE = 'text/html';

export function ClassifyRequest(request: Request): CacheRoute {
  if (request.method !== 'GET') {
    return 'BYPASS';
  }

  const request_url = new URL(request.url);

  if (request_url.pathname.startsWith('/api/')) {
    return 'BYPASS';
  }

  if (
    request.mode === 'navigate' ||
    request.headers.get('accept')?.includes(HTML_ACCEPT_TYPE)
  ) {
    return 'NAVIGATION';
  }

  if (request_url.pathname.startsWith('/_next/static/')) {
    return 'STATIC';
  }

  if (request.destination === 'image') {
    return 'IMAGE';
  }

  return 'BYPASS';
}

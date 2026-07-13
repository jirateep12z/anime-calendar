/// <reference lib="webworker" />

import { ACTIVE_CACHE_NAMES, APP_SHELL_CACHE } from './cache-names';
import { ClassifyRequest } from './cache-routes';
import {
  HandleImage,
  HandleNavigation,
  HandleStaticAsset
} from './cache-strategies';
import {
  CreateSafeNotificationTarget,
  ParseNotificationPayload,
  ReadWorkerNotificationLocalState,
  ShouldDisplayPush
} from './push-events';

declare const self: ServiceWorkerGlobalScope;

const APP_SHELL_URLS = ['/calendar/', '/offline/'] as const;
const SKIP_WAITING_EVENT_NAME = 'SKIP_WAITING';
const CACHE_NAME_PREFIX = 'anime-calendar-';

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then(cache => cache.addAll([...APP_SHELL_URLS]))
  );
});

self.addEventListener('message', event => {
  if (event.data?.event_name === SKIP_WAITING_EVENT_NAME) {
    void self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const cache_route = ClassifyRequest(event.request);

  if (cache_route === 'NAVIGATION') {
    event.respondWith(HandleNavigation(event.request));

    return;
  }

  if (cache_route === 'STATIC') {
    event.respondWith(HandleStaticAsset(event.request));

    return;
  }

  if (cache_route === 'IMAGE') {
    event.respondWith(
      HandleImage(event.request, {
        FetchRequest: request => fetch(request),
        OpenCache: cache_name => caches.open(cache_name),
        ReadNowMilliseconds: () => Date.now(),
        Defer: pending_operation => event.waitUntil(pending_operation)
      })
    );
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const obsolete_cache_names = (await caches.keys()).filter(
        cache_name =>
          cache_name.startsWith(CACHE_NAME_PREFIX) &&
          !ACTIVE_CACHE_NAMES.has(cache_name)
      );

      await Promise.all(
        obsolete_cache_names.map(cache_name => caches.delete(cache_name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('push', event => {
  event.waitUntil(
    (async () => {
      let parsed_value: unknown;

      try {
        parsed_value = event.data?.json();
      } catch {
        return;
      }

      const payload = ParseNotificationPayload(parsed_value);

      if (payload === null) {
        return;
      }

      const local_state = await ReadWorkerNotificationLocalState();

      if (!ShouldDisplayPush(payload, local_state)) {
        return;
      }

      const notification_options: NotificationOptions & {
        readonly image?: string;
      } = {
        body: payload.body,
        icon: payload.icon,
        tag: payload.tag,
        data: payload.data,
        ...(payload.image === undefined ? {} : { image: payload.image })
      };

      await self.registration.showNotification(
        payload.title,
        notification_options
      );
    })()
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const notification_data = event.notification.data as unknown;

      if (!notification_data || typeof notification_data !== 'object') {
        return;
      }

      const target_path = Reflect.get(notification_data, 'url');

      if (typeof target_path !== 'string') {
        return;
      }

      const target_url = CreateSafeNotificationTarget(
        target_path,
        self.location.origin
      );

      if (target_url === null) {
        return;
      }

      const window_clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      const existing_client = window_clients[0];

      if (existing_client) {
        await existing_client.navigate(target_url);
        await existing_client.focus();

        return;
      }

      await self.clients.openWindow(target_url);
    })()
  );
});

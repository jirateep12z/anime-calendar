"use strict";
(() => {
  // node_modules/idb/build/index.js
  var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
  var idbProxyableTypes;
  var cursorAdvanceMethods;
  function getIdbProxyableTypes() {
    return idbProxyableTypes || (idbProxyableTypes = [
      IDBIndex,
      IDBObjectStore,
      IDBCursor,
      IDBDatabase,
      IDBTransaction
    ]);
  }
  function getCursorAdvanceMethods() {
    return cursorAdvanceMethods || (cursorAdvanceMethods = ["advance", "continue", "continuePrimaryKey"].map((method) => IDBCursor.prototype[method]));
  }
  var transactionDoneMap = /* @__PURE__ */ new WeakMap();
  var transformCache = /* @__PURE__ */ new WeakMap();
  var reverseTransformCache = /* @__PURE__ */ new WeakMap();
  function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
      const unlisten = () => {
        request.removeEventListener("success", success);
        request.removeEventListener("error", error);
      };
      const success = () => {
        resolve(wrap(request.result));
        unlisten();
      };
      const error = () => {
        reject(request.error);
        unlisten();
      };
      request.addEventListener("success", success);
      request.addEventListener("error", error);
    });
    reverseTransformCache.set(promise, request);
    return promise;
  }
  function cacheDonePromiseForTransaction(tx) {
    if (transactionDoneMap.has(tx))
      return;
    const done = new Promise((resolve, reject) => {
      const unlisten = () => {
        tx.removeEventListener("complete", complete);
        tx.removeEventListener("error", error);
        tx.removeEventListener("abort", error);
      };
      const complete = () => {
        resolve();
        unlisten();
      };
      const error = () => {
        reject(tx.error || new DOMException("AbortError", "AbortError"));
        unlisten();
      };
      tx.addEventListener("complete", complete);
      tx.addEventListener("error", error);
      tx.addEventListener("abort", error);
    });
    transactionDoneMap.set(tx, done);
  }
  var idbProxyTraps = {
    get(target, prop, receiver) {
      if (target instanceof IDBTransaction) {
        if (prop === "done")
          return transactionDoneMap.get(target);
        if (prop === "store") {
          return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
        }
      }
      return wrap(target[prop]);
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
    has(target, prop) {
      if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
        return true;
      }
      return prop in target;
    }
  };
  function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
  }
  function wrapFunction(func) {
    if (getCursorAdvanceMethods().includes(func)) {
      return function(...args) {
        func.apply(unwrap(this), args);
        return wrap(this.request);
      };
    }
    return function(...args) {
      return wrap(func.apply(unwrap(this), args));
    };
  }
  function transformCachableValue(value) {
    if (typeof value === "function")
      return wrapFunction(value);
    if (value instanceof IDBTransaction)
      cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
      return new Proxy(value, idbProxyTraps);
    return value;
  }
  function wrap(value) {
    if (value instanceof IDBRequest)
      return promisifyRequest(value);
    if (transformCache.has(value))
      return transformCache.get(value);
    const newValue = transformCachableValue(value);
    if (!Object.is(newValue, value)) {
      transformCache.set(value, newValue);
      reverseTransformCache.set(newValue, value);
    }
    return newValue;
  }
  var unwrap = (value) => reverseTransformCache.get(value);
  function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
      request.addEventListener("upgradeneeded", (event) => {
        upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
      });
    }
    if (blocked) {
      request.addEventListener("blocked", (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion,
        event.newVersion,
        event
      ));
    }
    openPromise.then((db) => {
      if (terminated)
        db.addEventListener("close", () => terminated());
      if (blocking) {
        db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
      }
    }).catch(() => {
    });
    return openPromise;
  }
  var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
  var writeMethods = ["put", "add", "delete", "clear"];
  var cachedMethods = {};
  function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
      return;
    }
    if (cachedMethods[prop])
      return cachedMethods[prop];
    const targetFuncName = prop.replace(/FromIndex$/, "");
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
      // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
      !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
    ) {
      return;
    }
    const method = async function(storeName, ...args) {
      const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
      let target2 = tx.store;
      if (useIndex)
        target2 = target2.index(args.shift());
      return (await Promise.all([
        target2[targetFuncName](...args),
        isWrite && tx.done
      ]))[0];
    };
    return cachedMethods[prop] = method;
  }
  replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
  }));
  var advanceMethodProps = ["advance", "continue", "continuePrimaryKey"];
  var methodMap = {};
  var advanceResults = /* @__PURE__ */ new WeakMap();
  var ittrProxiedCursorToOriginalProxy = /* @__PURE__ */ new WeakMap();
  var cursorIteratorTraps = {
    get(target, prop) {
      if (!advanceMethodProps.includes(prop))
        return target[prop];
      let cachedFunc = methodMap[prop];
      if (!cachedFunc) {
        cachedFunc = methodMap[prop] = function(...args) {
          advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
        };
      }
      return cachedFunc;
    }
  };
  async function* iterate(...args) {
    let cursor = this;
    if (!(cursor instanceof IDBCursor)) {
      cursor = await cursor.openCursor(...args);
    }
    if (!cursor)
      return;
    cursor = cursor;
    const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
    ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
    reverseTransformCache.set(proxiedCursor, unwrap(cursor));
    while (cursor) {
      yield proxiedCursor;
      cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
      advanceResults.delete(proxiedCursor);
    }
  }
  function isIteratorProp(target, prop) {
    return prop === Symbol.asyncIterator && instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor]) || prop === "iterate" && instanceOfAny(target, [IDBIndex, IDBObjectStore]);
  }
  replaceTraps((oldTraps) => ({
    ...oldTraps,
    get(target, prop, receiver) {
      if (isIteratorProp(target, prop))
        return iterate;
      return oldTraps.get(target, prop, receiver);
    },
    has(target, prop) {
      return isIteratorProp(target, prop) || oldTraps.has(target, prop);
    }
  }));

  // src/features/offline-storage/services/offline-database.ts
  var OFFLINE_DATABASE_NAME = "anime-calendar-notifications";
  var OFFLINE_DATABASE_VERSION = 1;
  var OfflineStorageError = class extends Error {
    constructor(cause) {
      super("Offline storage is unavailable.");
      this.name = "OfflineStorageError";
      this.error_code = "OFFLINE_STORAGE_UNAVAILABLE";
      this.cause = cause;
    }
  };
  var database_promise = null;
  function CreateOfflineDatabase() {
    return openDB(
      OFFLINE_DATABASE_NAME,
      OFFLINE_DATABASE_VERSION,
      {
        upgrade(database) {
          database.createObjectStore("bookmark_snapshot", {
            keyPath: "anilist_media_id"
          });
          const bookmark_mutation_store = database.createObjectStore(
            "bookmark_mutations",
            { keyPath: "client_mutation_id" }
          );
          bookmark_mutation_store.createIndex("by-media-id", "anilist_media_id");
          bookmark_mutation_store.createIndex("by-sequence", "client_sequence");
          database.createObjectStore("preference_mutations");
          database.createObjectStore("metadata", { keyPath: "key" });
          database.createObjectStore("notification_local_state");
          database.createObjectStore("local_delivery_history", {
            keyPath: "anilist_schedule_id"
          });
          database.createObjectStore("bookmark_catalog", {
            keyPath: "anilist_media_id"
          });
        }
      }
    );
  }
  async function OpenOfflineDatabase() {
    try {
      database_promise ??= CreateOfflineDatabase();
      return await database_promise;
    } catch (error) {
      database_promise = null;
      throw new OfflineStorageError(error);
    }
  }

  // src/features/anime-notifications/storage/notification-local-state.ts
  async function ReadWorkerNotificationLocalState() {
    const database = await OpenOfflineDatabase();
    return await database.get("notification_local_state", "current") ?? null;
  }

  // src/service-worker/cache-names.ts
  var SERVICE_WORKER_VERSION = "ee379813-6e20-4a92-9d1e-f9bbdcd73b44";
  var APP_SHELL_CACHE = `anime-calendar-shell-${SERVICE_WORKER_VERSION}`;
  var STATIC_CACHE = `anime-calendar-static-${SERVICE_WORKER_VERSION}`;
  var IMAGE_CACHE = `anime-calendar-images-${SERVICE_WORKER_VERSION}`;
  var IMAGE_METADATA_CACHE = `anime-calendar-image-metadata-${SERVICE_WORKER_VERSION}`;
  var ACTIVE_CACHE_NAMES = Object.freeze(
    /* @__PURE__ */ new Set([APP_SHELL_CACHE, STATIC_CACHE, IMAGE_CACHE, IMAGE_METADATA_CACHE])
  );

  // src/service-worker/cache-routes.ts
  var HTML_ACCEPT_TYPE = "text/html";
  function ClassifyRequest(request) {
    if (request.method !== "GET") {
      return "BYPASS";
    }
    const request_url = new URL(request.url);
    if (request_url.pathname.startsWith("/api/")) {
      return "BYPASS";
    }
    if (request.mode === "navigate" || request.headers.get("accept")?.includes(HTML_ACCEPT_TYPE)) {
      return "NAVIGATION";
    }
    if (request_url.pathname.startsWith("/_next/static/")) {
      return "STATIC";
    }
    if (request.destination === "image") {
      return "IMAGE";
    }
    return "BYPASS";
  }

  // src/service-worker/cache-strategies.ts
  var CALENDAR_SHELL_URL = "/calendar/";
  var COMPLETED_BOOKMARKS_SHELL_URL = "/calendar/completed/";
  var OFFLINE_FALLBACK_URL = "/offline/";
  var IMAGE_METADATA_ORIGIN = "https://anime-calendar-cache.invalid";
  var IMAGE_CACHE_MAX_ENTRIES = 200;
  var IMAGE_CACHE_MAX_AGE_MILLISECONDS = 7 * 24 * 60 * 60 * 1e3;
  function ReadCalendarShellUrl(request) {
    const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
    if (pathname === "/calendar") {
      return CALENDAR_SHELL_URL;
    }
    if (pathname === "/calendar/completed") {
      return COMPLETED_BOOKMARKS_SHELL_URL;
    }
    return null;
  }
  var DEFAULT_DEPENDENCIES = Object.freeze({
    FetchRequest: (request) => fetch(request),
    OpenCache: (cache_name) => caches.open(cache_name),
    ReadNowMilliseconds: () => Date.now(),
    Defer: () => void 0
  });
  function ShouldCacheResponse(network_response) {
    return network_response.ok || network_response.type === "opaque";
  }
  function CreateImageMetadataRequest(request) {
    const metadata_url = new URL("/image-cache-entry", IMAGE_METADATA_ORIGIN);
    metadata_url.searchParams.set("request_url", request.url);
    return new Request(metadata_url);
  }
  async function WriteImageCacheMetadata(request, cached_at_milliseconds, metadata_cache) {
    await metadata_cache.put(
      CreateImageMetadataRequest(request),
      new Response(String(cached_at_milliseconds))
    );
  }
  async function CleanupImageCache(image_cache, metadata_cache, now_milliseconds) {
    const cached_requests = await image_cache.keys();
    const cache_entries = await Promise.all(
      cached_requests.map(async (cached_request) => {
        const metadata_response = await metadata_cache.match(
          CreateImageMetadataRequest(cached_request)
        );
        const cached_at_milliseconds = Number(
          await metadata_response?.text() ?? 0
        );
        return Object.freeze({ cached_request, cached_at_milliseconds });
      })
    );
    const valid_entries = cache_entries.filter(
      ({ cached_at_milliseconds }) => cached_at_milliseconds > 0 && now_milliseconds - cached_at_milliseconds <= IMAGE_CACHE_MAX_AGE_MILLISECONDS
    ).toSorted(
      (left_entry, right_entry) => right_entry.cached_at_milliseconds - left_entry.cached_at_milliseconds
    );
    const retained_request_urls = new Set(
      valid_entries.slice(0, IMAGE_CACHE_MAX_ENTRIES).map(({ cached_request }) => cached_request.url)
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
  async function RefreshImageCache(request, dependencies) {
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
  async function HandleNavigation(request, dependencies = DEFAULT_DEPENDENCIES) {
    const requested_shell_url = ReadCalendarShellUrl(request);
    async function ReadFallbackResponse() {
      const app_shell_cache = await dependencies.OpenCache(APP_SHELL_CACHE);
      const cached_response = await app_shell_cache.match(
        requested_shell_url ?? CALENDAR_SHELL_URL
      ) ?? await app_shell_cache.match(OFFLINE_FALLBACK_URL);
      const fallback_response = cached_response ?? new Response("Offline fallback is unavailable.", { status: 503 });
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
      if (requested_shell_url !== null) {
        const app_shell_cache = await dependencies.OpenCache(APP_SHELL_CACHE);
        await app_shell_cache.put(requested_shell_url, network_response.clone());
      }
      return network_response;
    } catch {
      return await ReadFallbackResponse();
    }
  }
  async function HandleStaticAsset(request, dependencies = DEFAULT_DEPENDENCIES) {
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
  async function HandleImage(request, dependencies = DEFAULT_DEPENDENCIES) {
    const image_cache = await dependencies.OpenCache(IMAGE_CACHE);
    const cached_response = await image_cache.match(request);
    if (cached_response) {
      dependencies.Defer(RefreshImageCache(request, dependencies));
      return cached_response;
    }
    return RefreshImageCache(request, dependencies);
  }

  // src/service-worker/push-events.ts
  function IsRecord(value) {
    return typeof value === "object" && value !== null;
  }
  function IsNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }
  function ParseNotificationPayload(value) {
    if (!IsRecord(value) || !IsRecord(value.data)) {
      return null;
    }
    if (!IsNonEmptyString(value.title) || !IsNonEmptyString(value.body) || !IsNonEmptyString(value.tag) || !IsNonEmptyString(value.icon) || value.image !== void 0 && !IsNonEmptyString(value.image) || !IsNonEmptyString(value.data.url) || !Number.isSafeInteger(value.data.anilist_schedule_id) || Number(value.data.anilist_schedule_id) <= 0 || typeof value.data.is_adult !== "boolean") {
      return null;
    }
    return Object.freeze({
      title: value.title,
      body: value.body,
      tag: value.tag,
      icon: value.icon,
      ...value.image === void 0 ? {} : { image: value.image },
      data: Object.freeze({
        url: value.data.url,
        anilist_schedule_id: Number(value.data.anilist_schedule_id),
        is_adult: value.data.is_adult
      })
    });
  }
  function ShouldDisplayPush(payload, local_state) {
    if (local_state?.is_notification_enabled !== true) {
      return false;
    }
    if (!payload.data.is_adult) {
      return true;
    }
    return local_state.is_adult_confirmed && local_state.is_adult_content_visible;
  }
  function CreateSafeNotificationTarget(target_path, origin) {
    try {
      const target_url = new URL(target_path, origin);
      return target_url.origin === origin ? target_url.href : null;
    } catch {
      return null;
    }
  }

  // src/service-worker/service-worker.ts
  var APP_SHELL_URLS = ["/calendar/", "/offline/"];
  var SKIP_WAITING_EVENT_NAME = "SKIP_WAITING";
  var CACHE_NAME_PREFIX = "anime-calendar-";
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll([...APP_SHELL_URLS]))
    );
  });
  self.addEventListener("message", (event) => {
    if (event.data?.event_name === SKIP_WAITING_EVENT_NAME) {
      void self.skipWaiting();
    }
  });
  self.addEventListener("fetch", (event) => {
    const cache_route = ClassifyRequest(event.request);
    if (cache_route === "NAVIGATION") {
      event.respondWith(HandleNavigation(event.request));
      return;
    }
    if (cache_route === "STATIC") {
      event.respondWith(HandleStaticAsset(event.request));
      return;
    }
    if (cache_route === "IMAGE") {
      event.respondWith(
        HandleImage(event.request, {
          FetchRequest: (request) => fetch(request),
          OpenCache: (cache_name) => caches.open(cache_name),
          ReadNowMilliseconds: () => Date.now(),
          Defer: (pending_operation) => event.waitUntil(pending_operation)
        })
      );
    }
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        const obsolete_cache_names = (await caches.keys()).filter(
          (cache_name) => cache_name.startsWith(CACHE_NAME_PREFIX) && !ACTIVE_CACHE_NAMES.has(cache_name)
        );
        await Promise.all(
          obsolete_cache_names.map((cache_name) => caches.delete(cache_name))
        );
        await self.clients.claim();
      })()
    );
  });
  self.addEventListener("push", (event) => {
    event.waitUntil(
      (async () => {
        let parsed_value;
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
        const notification_options = {
          body: payload.body,
          icon: payload.icon,
          tag: payload.tag,
          data: payload.data,
          ...payload.image === void 0 ? {} : { image: payload.image }
        };
        await self.registration.showNotification(
          payload.title,
          notification_options
        );
      })()
    );
  });
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
      (async () => {
        const notification_data = event.notification.data;
        if (!notification_data || typeof notification_data !== "object") {
          return;
        }
        const target_path = Reflect.get(notification_data, "url");
        if (typeof target_path !== "string") {
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
          type: "window",
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
})();

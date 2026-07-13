const SERVICE_WORKER_VERSION = process.env.SERVICE_WORKER_VERSION;

export const APP_SHELL_CACHE = `anime-calendar-shell-${SERVICE_WORKER_VERSION}`;
export const STATIC_CACHE = `anime-calendar-static-${SERVICE_WORKER_VERSION}`;
export const IMAGE_CACHE = `anime-calendar-images-${SERVICE_WORKER_VERSION}`;
export const IMAGE_METADATA_CACHE = `anime-calendar-image-metadata-${SERVICE_WORKER_VERSION}`;

export const ACTIVE_CACHE_NAMES = Object.freeze(
  new Set([APP_SHELL_CACHE, STATIC_CACHE, IMAGE_CACHE, IMAGE_METADATA_CACHE])
);

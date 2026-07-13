const DEFAULT_SITE_URL = 'https://anime-calendar-th.vercel.app';
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const SITE_ORIGIN_VALUE = PUBLIC_SITE_URL || DEFAULT_SITE_URL;

export const SITE_ORIGIN = new URL(SITE_ORIGIN_VALUE);

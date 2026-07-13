/**
 * Distance between the mobile bottom navigation and the bottom screen edge.
 * The 1rem minimum matches the navigation's horizontal inset (`inset-x-4`).
 * Subtracting 1rem from the safe-area inset keeps the navigation clear of the
 * iOS home indicator without leaving the full inset as empty space.
 */
export const APP_BOTTOM_NAV_BOTTOM_OFFSET =
  'max(1rem, calc(env(safe-area-inset-bottom) - 1rem))';

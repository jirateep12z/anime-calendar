'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { THEME_STORAGE_KEY } from '../constants/storage-keys';
import { UseAppDispatch, UseAppSelector } from '../hooks/use-redux';
import { ApplyThemeClass } from '../services/theme-class';
import { HydrateTheme } from '../store/theme-slice';

import type { ThemeMode } from '../types/theme';

const VALID_THEMES = new Set<ThemeMode>(['light', 'dark', 'system']);

function WriteStorageFallback(
  storage_key: string,
  fallback_state: Record<string, unknown>
) {
  try {
    localStorage.setItem(storage_key, JSON.stringify(fallback_state));
  } catch (error) {
    console.warn('Error writing fallback storage state:', error);
  }
}

export function StoreHydrator() {
  const dispatch = UseAppDispatch();
  const theme_hydrated = UseAppSelector(state => state.theme.is_hydrated);
  const theme = UseAppSelector(state => state.theme.theme);
  const pathname = usePathname();

  useEffect(() => {
    if (theme_hydrated) return;
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      const raw_theme = parsed?.theme;
      const theme: ThemeMode = VALID_THEMES.has(raw_theme)
        ? raw_theme
        : 'system';

      dispatch(HydrateTheme(theme));
    } catch (error) {
      console.error('Error loading theme state from localStorage:', error);
      WriteStorageFallback(THEME_STORAGE_KEY, { theme: 'system' });
      dispatch(HydrateTheme('system'));
    }
  }, [dispatch, theme_hydrated]);

  useEffect(() => {
    if (!theme_hydrated) return;
    ApplyThemeClass(theme);
  }, [pathname, theme, theme_hydrated]);

  useEffect(() => {
    if (!theme_hydrated || theme !== 'system') return;
    const color_scheme_query = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );
    const HandleColorSchemeChange = () => ApplyThemeClass('system');

    color_scheme_query.addEventListener('change', HandleColorSchemeChange);

    return () => {
      color_scheme_query.removeEventListener('change', HandleColorSchemeChange);
    };
  }, [theme, theme_hydrated]);

  return null;
}

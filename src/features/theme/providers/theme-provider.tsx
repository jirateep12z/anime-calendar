'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { THEME_STORAGE_KEY } from '@/constants/storage-keys';

import type { ThemeMode } from '@/types/theme';
import type { ReactNode } from 'react';

const VALID_THEMES = new Set<ThemeMode>(['light', 'dark', 'system']);

interface ThemeContextValue {
  readonly theme_mode: ThemeMode;
  readonly ChangeTheme: (theme_mode: ThemeMode) => void;
}

interface ThemeProviderProps {
  readonly children: ReactNode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function ApplyThemeClass(theme_mode: ThemeMode) {
  const is_dark_theme =
    theme_mode === 'dark' ||
    (theme_mode === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.classList.toggle('dark', is_dark_theme);
}

function ReadStoredTheme(): ThemeMode {
  try {
    const stored_theme_state = localStorage.getItem(THEME_STORAGE_KEY);
    const parsed_theme_state = stored_theme_state
      ? (JSON.parse(stored_theme_state) as { readonly theme?: unknown })
      : null;

    return VALID_THEMES.has(parsed_theme_state?.theme as ThemeMode)
      ? (parsed_theme_state?.theme as ThemeMode)
      : 'system';
  } catch {
    return 'system';
  }
}

function WriteStoredTheme(theme_mode: ThemeMode) {
  try {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ theme: theme_mode })
    );
  } catch {
    // การเปลี่ยนธีมยังทำงานได้เมื่อ browser ปิดกั้น storage
  }
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const pathname = usePathname();
  const [theme_mode, set_theme_mode] = useState<ThemeMode>('system');

  useEffect(() => {
    queueMicrotask(() => set_theme_mode(ReadStoredTheme()));
  }, []);

  useEffect(() => {
    ApplyThemeClass(theme_mode);
  }, [pathname, theme_mode]);

  useEffect(() => {
    if (theme_mode !== 'system') return;
    const color_scheme_query = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );
    const HandleColorSchemeChange = () => ApplyThemeClass('system');

    color_scheme_query.addEventListener('change', HandleColorSchemeChange);

    return () => {
      color_scheme_query.removeEventListener('change', HandleColorSchemeChange);
    };
  }, [theme_mode]);

  const ChangeTheme = useCallback((next_theme_mode: ThemeMode) => {
    set_theme_mode(next_theme_mode);
    WriteStoredTheme(next_theme_mode);
  }, []);

  const context_value = useMemo<ThemeContextValue>(
    () => ({ theme_mode, ChangeTheme }),
    [ChangeTheme, theme_mode]
  );

  return (
    <ThemeContext.Provider value={context_value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function UseTheme() {
  const theme_context = useContext(ThemeContext);

  if (theme_context === null) {
    throw new Error('UseTheme ต้องใช้งานภายใน ThemeProvider');
  }

  return theme_context;
}

import { configureStore } from '@reduxjs/toolkit';

import { THEME_STORAGE_KEY } from '../constants/storage-keys';
import ThemeSlice from '../store/theme-slice';
import { ApplyThemeClass } from './theme-class';

const MakeStore = () => {
  const store = configureStore({
    reducer: {
      theme: ThemeSlice
    }
  });

  if (typeof window !== 'undefined') {
    let prev_theme = store.getState().theme.theme;
    let prev_theme_hydrated = store.getState().theme.is_hydrated;

    store.subscribe(() => {
      const state = store.getState();

      if (
        state.theme.theme !== prev_theme ||
        state.theme.is_hydrated !== prev_theme_hydrated
      ) {
        prev_theme = state.theme.theme;
        prev_theme_hydrated = state.theme.is_hydrated;
        try {
          localStorage.setItem(
            THEME_STORAGE_KEY,
            JSON.stringify({ theme: state.theme.theme })
          );
        } catch (error) {
          console.warn('Failed to persist theme state:', error);
        }

        ApplyThemeClass(state.theme.theme);
      }
    });
  }

  return store;
};

let browser_store: ReturnType<typeof MakeStore> | undefined;

export function GetClientStore() {
  if (typeof window === 'undefined') {
    return MakeStore();
  }

  if (!browser_store) {
    browser_store = MakeStore();
  }

  return browser_store;
}

export type AppStore = ReturnType<typeof MakeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

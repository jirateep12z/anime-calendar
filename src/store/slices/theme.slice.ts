import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { ThemeMode } from '@/types/theme';
import type { ThemeState } from '@/types/theme-state';

const initial_state: ThemeState = {
  theme: 'system',
  is_hydrated: false
};

const ThemeSlice = createSlice({
  name: 'theme',
  initialState: initial_state,
  reducers: {
    SetTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    HydrateTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
      state.is_hydrated = true;
    }
  }
});

export const { SetTheme, HydrateTheme } = ThemeSlice.actions;

export default ThemeSlice.reducer;

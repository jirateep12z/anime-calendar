'use client';

import { GetClientStore } from '@/store';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { StoreHydrator } from './store-hydrator';

import type { AppStore } from '@/store';
import type { ReduxProviderProps } from '@/types/redux-provider';

export function ReduxProvider({ children }: ReduxProviderProps) {
  const [store] = useState<AppStore>(() => GetClientStore());

  return (
    <Provider store={store}>
      <StoreHydrator />
      {children}
    </Provider>
  );
}

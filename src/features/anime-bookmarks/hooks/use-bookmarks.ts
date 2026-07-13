'use client';

import { useContext } from 'react';

import { BookmarkContext } from '../providers/bookmark-context';

import type { BookmarkContextValue } from '../types/bookmark';

export function UseBookmarks(): BookmarkContextValue {
  const context_value = useContext(BookmarkContext);

  if (context_value === null) {
    throw new Error('UseBookmarks must be used within BookmarkProvider.');
  }

  return context_value;
}

'use client';

import { createContext } from 'react';

import type { BookmarkContextValue } from '../types/bookmark';

export const BookmarkContext = createContext<BookmarkContextValue | null>(null);

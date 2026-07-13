'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NotificationProvider } from '@/features/anime-notifications/providers/notification-provider';
import { PwaProvider } from '@/features/pwa/providers/pwa-provider';
import { ThemeProvider } from '@/features/theme/providers/theme-provider';

import type { ReactNode } from 'react';

const QUERY_STALE_TIME_MILLISECONDS = 15 * 60 * 1000;

interface CalendarProvidersProps {
  readonly children: ReactNode;
}

function CreateCalendarQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MILLISECONDS,
        refetchInterval: QUERY_STALE_TIME_MILLISECONDS,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        retry: false
      }
    }
  });
}

export function CalendarProviders({ children }: CalendarProvidersProps) {
  const [query_client] = useState(CreateCalendarQueryClient);

  return (
    <QueryClientProvider client={query_client}>
      <ThemeProvider>
        <PwaProvider>
          <NotificationProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </NotificationProvider>
        </PwaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

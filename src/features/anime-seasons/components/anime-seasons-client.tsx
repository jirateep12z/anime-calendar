'use client';

import { useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { UseNotifications } from '@/features/anime-notifications/client';
import { FinishAppLoading } from '@/features/app-loading';
import { AppHeader } from '@/features/app-shell/client';
import { UsePwa } from '@/features/pwa/client';
import { SEASON_COPY, SEASON_LABELS } from '../constants/season-copy';
import { UseAnimeSeasonLocation } from '../hooks/use-anime-season-location';
import { AnimeSeasonBookmarkFeedback } from './anime-season-bookmark-feedback';
import { AnimeSeasonControls } from './anime-season-controls';
import { AnimeSeasonResults } from './anime-season-results';

import type {
  AnimeSeasonSelection,
  AnimeSeasonStatusFilter
} from '@/features/anime-schedule';
import type { SeasonPageCopy } from '../constants/season-copy';

export function AnimeSeasonsClient({
  default_selection,
  media_status,
  page_copy
}: {
  readonly default_selection: AnimeSeasonSelection;
  readonly media_status?: AnimeSeasonStatusFilter;
  readonly page_copy: SeasonPageCopy;
}) {
  const { parsed_selection, HandleSelect } =
    UseAnimeSeasonLocation(default_selection);
  const { preferences } = UseNotifications();
  const { is_online } = UsePwa();
  const is_adult_content_visible =
    preferences.is_adult_confirmed && preferences.is_adult_content_visible;
  const selection = parsed_selection.is_valid
    ? parsed_selection.selection
    : default_selection;
  const period_key = `${selection.season_year}-${selection.season}`;

  useEffect(() => {
    FinishAppLoading();
  }, []);

  return (
    <>
      <AppHeader />
      <main className="bg-background mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col gap-6 px-4 py-6 sm:py-8 lg:px-6">
        <header className="flex flex-col items-start gap-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {page_copy.TITLE}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
            {page_copy.INTRO}
          </p>
        </header>
        <AnimeSeasonControls
          key={`${parsed_selection.is_valid}-${period_key}`}
          selection={selection}
          HandleSelect={HandleSelect}
        />
        <AnimeSeasonBookmarkFeedback />
        {parsed_selection.is_valid ? (
          <section
            aria-labelledby="season-results-title"
            className="flex flex-col gap-4"
          >
            <h2 id="season-results-title" className="text-xl font-semibold">
              {SEASON_LABELS[selection.season]} {selection.season_year}
            </h2>
            <AnimeSeasonResults
              key={`${period_key}-${is_adult_content_visible}-${media_status ?? 'ALL'}`}
              selection={selection}
              is_adult_content_visible={is_adult_content_visible}
              is_online={is_online}
              media_status={media_status}
              page_copy={page_copy}
            />
          </section>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>{SEASON_COPY.URL_ERROR}</AlertDescription>
          </Alert>
        )}
      </main>
    </>
  );
}

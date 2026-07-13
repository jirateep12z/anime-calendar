'use client';

import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { UseBookmarks } from '@/features/anime-bookmarks/client';
import { SEASON_COPY } from '../constants/season-copy';

export function AnimeSeasonBookmarkFeedback() {
  const { sync_error_message, catalog_error_message, RetryPendingMutations } =
    UseBookmarks();
  const [is_retrying, set_is_retrying] = useState(false);
  const [retry_error, set_retry_error] = useState<string | null>(null);
  const message = retry_error ?? sync_error_message ?? catalog_error_message;

  async function HandleRetry() {
    if (is_retrying) return;
    set_is_retrying(true);
    set_retry_error(null);

    try {
      await RetryPendingMutations();
    } catch {
      set_retry_error(SEASON_COPY.BOOKMARK_ERROR);
    } finally {
      set_is_retrying(false);
    }
  }

  if (message === null) return null;

  return (
    <Alert variant="destructive">
      <AlertDescription className="flex flex-col items-start gap-3">
        <p>{message}</p>
        <Button
          type="button"
          variant="outline"
          disabled={is_retrying}
          onClick={() => void HandleRetry()}
        >
          {SEASON_COPY.RETRY}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

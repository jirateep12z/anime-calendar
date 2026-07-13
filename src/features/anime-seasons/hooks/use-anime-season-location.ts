'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { AnimeSeasonSelection } from '@/features/anime-schedule';
import { ParseAnimeSeasonSelection } from '../services/anime-season-selection';

export function UseAnimeSeasonLocation(
  default_selection: AnimeSeasonSelection
) {
  const search_query = useSearchParams().toString();
  const [parsed_selection, set_parsed_selection] = useState(() =>
    ParseAnimeSeasonSelection(
      new URLSearchParams(search_query),
      default_selection
    )
  );

  useEffect(() => {
    const search_params = new URLSearchParams(window.location.search);

    if (!search_params.has('season_year') && !search_params.has('season'))
      return;

    search_params.delete('season_year');
    search_params.delete('season');
    const remaining_query = search_params.toString();

    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname +
        (remaining_query ? `?${remaining_query}` : '') +
        window.location.hash
    );
  }, []);

  function HandleSelect(selection: AnimeSeasonSelection) {
    if (
      parsed_selection.is_valid &&
      selection.season_year === parsed_selection.selection.season_year &&
      selection.season === parsed_selection.selection.season
    )
      return;

    set_parsed_selection({
      is_valid: true,
      selection,
      needs_normalization: false
    });
  }

  return { parsed_selection, HandleSelect };
}

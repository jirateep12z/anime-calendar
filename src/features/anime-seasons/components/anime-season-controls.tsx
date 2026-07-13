'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AnimeSeasonSelection } from '@/features/anime-schedule';
import { ANIME_SEASONS } from '@/features/anime-schedule';
import { SEASON_COPY, SEASON_LABELS } from '../constants/season-copy';
import { ParseAnimeSeasonYearInput } from '../services/anime-season-selection';

import type { FormEvent } from 'react';

interface AnimeSeasonControlsProps {
  readonly selection: AnimeSeasonSelection;
  readonly HandleSelect: (selection: AnimeSeasonSelection) => void;
}

export function AnimeSeasonControls({
  selection,
  HandleSelect
}: AnimeSeasonControlsProps) {
  const [year_input, set_year_input] = useState(String(selection.season_year));
  const [has_year_error, set_has_year_error] = useState(false);

  function HandleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const season_year = ParseAnimeSeasonYearInput(year_input);

    set_has_year_error(season_year === null);
    if (season_year !== null) HandleSelect({ ...selection, season_year });
  }

  return (
    <form noValidate onSubmit={HandleSubmit}>
      <FieldGroup className="gap-4 sm:flex-row sm:items-start">
        <Field className="sm:w-64" data-invalid={has_year_error}>
          <FieldLabel htmlFor="season-year">{SEASON_COPY.YEAR}</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="season-year"
              type="number"
              inputMode="numeric"
              min={1}
              max={9999}
              step={1}
              value={year_input}
              aria-invalid={has_year_error}
              aria-describedby={
                has_year_error ? 'season-year-error' : undefined
              }
              onChange={event => set_year_input(event.target.value)}
            />
            <Button type="submit" className="shrink-0">
              {SEASON_COPY.APPLY}
            </Button>
          </div>
          {has_year_error ? (
            <FieldError id="season-year-error">
              {SEASON_COPY.YEAR_ERROR}
            </FieldError>
          ) : null}
        </Field>
        <Field className="sm:w-auto">
          <FieldTitle id="season-label">{SEASON_COPY.SEASON}</FieldTitle>
          <ToggleGroup
            type="single"
            variant="outline"
            value={selection.season}
            className="grid w-full grid-cols-2 sm:flex sm:w-auto"
            aria-labelledby="season-label"
            onValueChange={selected_season => {
              const season = ANIME_SEASONS.find(
                candidate => candidate === selected_season
              );

              if (season !== undefined) HandleSelect({ ...selection, season });
            }}
          >
            {ANIME_SEASONS.map(season => (
              <ToggleGroupItem key={season} value={season} className="min-h-10">
                {SEASON_LABELS[season]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      </FieldGroup>
    </form>
  );
}

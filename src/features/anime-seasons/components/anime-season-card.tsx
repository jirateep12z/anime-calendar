'use client';

import { StarIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { NormalizeAnimeDescription } from '@/features/anime-schedule';
import {
  AnimeStatusBadge,
  ScheduleCover
} from '@/features/anime-schedule/client';
import { SEASON_COPY, STATUS_LABELS } from '../constants/season-copy';

import type { AnimeCatalogEntry } from '@/features/anime-schedule';
import type { ReactNode } from 'react';

interface AnimeSeasonCardProps {
  readonly entry: AnimeCatalogEntry;
  readonly is_pending: boolean;
  readonly bookmark_action: ReactNode;
  readonly HandleOpen: (
    entry: AnimeCatalogEntry,
    trigger: HTMLButtonElement
  ) => void;
}

export function AnimeSeasonCard({
  entry,
  is_pending,
  bookmark_action,
  HandleOpen
}: AnimeSeasonCardProps) {
  const detail_label = SEASON_COPY.DETAIL + ': ' + entry.title.primary;
  const status_label =
    entry.media_status === null ? '—' : STATUS_LABELS[entry.media_status];
  const secondary_title = [entry.title.romaji, entry.title.native].find(
    title => title !== null && title !== entry.title.primary
  );
  const description = NormalizeAnimeDescription(entry.description);

  return (
    <li className="min-w-0">
      <Card className="focus-within:ring-ring relative h-full p-0 transition-transform focus-within:ring-3 focus-within:outline-none hover:-translate-y-0.5 motion-reduce:transform-none">
        <button
          type="button"
          className="grid h-full w-full grid-cols-[7rem_minmax(0,1fr)] items-stretch text-left focus-visible:outline-none sm:grid-cols-[8rem_minmax(0,1fr)]"
          aria-label={detail_label}
          onClick={event => HandleOpen(entry, event.currentTarget)}
        >
          <ScheduleCover
            cover_image_url={entry.cover_image_url}
            title={entry.title.primary}
            className="!aspect-auto h-full min-h-44 w-full shrink-0 sm:w-full"
            sizes="(max-width: 639px) 112px, 128px"
          />
          <div className="flex min-h-44 min-w-0 flex-col gap-3 p-4">
            <CardContent className="flex min-w-0 items-baseline justify-between gap-3 p-0">
              <span>
                <span className="text-2xl font-bold tabular-nums">
                  {entry.total_episodes?.toLocaleString('th-TH') ?? '—'}
                </span>
                <span className="text-muted-foreground text-xs">{' ตอน'}</span>
              </span>
              <span className="text-muted-foreground text-xs">
                {entry.format?.replaceAll('_', ' ') ?? '—'}
              </span>
            </CardContent>
            <CardHeader className="min-w-0 p-0">
              <CardTitle className="line-clamp-2 leading-snug">
                <h3 className="wrap-anywhere">{entry.title.primary}</h3>
              </CardTitle>
              {secondary_title !== undefined ? (
                <CardDescription className="line-clamp-2 text-xs leading-relaxed wrap-anywhere">
                  {secondary_title}
                </CardDescription>
              ) : null}
            </CardHeader>
            {description ? (
              <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed wrap-anywhere">
                {description}
              </p>
            ) : null}
            {is_pending ? (
              <span role="status" className="text-muted-foreground text-xs">
                {'รอซิงก์'}
              </span>
            ) : null}
            <CardFooter className="mt-auto flex flex-wrap gap-1.5 p-0">
              <Badge variant="secondary" className="rounded-sm">
                {status_label}
              </Badge>
              <Badge variant="secondary" className="rounded-sm">
                <StarIcon data-icon="inline-start" aria-hidden="true" />
                {entry.average_score === null ? '—' : entry.average_score + '%'}
              </Badge>
              {entry.is_adult ? (
                <AnimeStatusBadge status="ADULT">{'18+'}</AnimeStatusBadge>
              ) : null}
            </CardFooter>
          </div>
        </button>
        <div className="bg-background/90 absolute top-2 left-2 rounded-md">
          {bookmark_action}
        </div>
      </Card>
    </li>
  );
}

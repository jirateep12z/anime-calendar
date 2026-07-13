import { ExternalLinkIcon, XIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { NormalizeAnimeDescription } from '../utils/anime-description';
import { NormalizeHttpUrl } from '../utils/external-url';
import { AnimeStatusBadge } from './anime-status-badge';
import { ScheduleCover } from './schedule-cover';

import type { ReactNode } from 'react';

export type AnimeDetailDialogRow = readonly [label: string, value: string];

interface AnimeDetailDialogLayoutProps {
  readonly title: string;
  readonly description: string;
  readonly cover_image_url: string | null;
  readonly format: string | null;
  readonly episode_label: string | null;
  readonly status_label?: string | null;
  readonly is_adult: boolean;
  readonly rows: readonly AnimeDetailDialogRow[];
  readonly body_description: string | null;
  readonly anilist_url: string | null;
  readonly actions?: ReactNode;
}

export function AnimeDetailDialogLayout({
  title,
  description,
  cover_image_url,
  format,
  episode_label,
  status_label = null,
  is_adult,
  rows,
  body_description,
  anilist_url,
  actions
}: AnimeDetailDialogLayoutProps) {
  const safe_anilist_url = NormalizeHttpUrl(anilist_url);
  const normalized_body_description =
    NormalizeAnimeDescription(body_description);

  return (
    <DialogContent
      showCloseButton={false}
      className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:min-h-[32rem] sm:max-w-3xl"
    >
      <div className="grid gap-6 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="order-1 min-w-0 sm:order-2 sm:col-start-2 sm:row-start-1">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <DialogHeader className="min-w-0 flex-1">
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
              >
                <XIcon aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </div>
        <div
          data-slot="anime-detail-cover"
          className="order-2 mx-auto aspect-[2/3] w-full overflow-hidden rounded-lg sm:order-1 sm:col-start-1 sm:row-span-2 sm:row-start-1 sm:aspect-auto sm:h-full sm:w-48"
        >
          <ScheduleCover
            cover_image_url={cover_image_url}
            title={title}
            className="!aspect-auto h-full w-full"
            sizes="192px"
          />
        </div>
        <div className="order-3 flex min-w-0 flex-col gap-5 sm:col-start-2 sm:row-start-2">
          <div className="flex flex-wrap gap-2">
            {format ? <Badge variant="outline">{format}</Badge> : null}
            {episode_label ? (
              <Badge variant="secondary">{episode_label}</Badge>
            ) : null}
            {status_label ? (
              <Badge variant="secondary">{status_label}</Badge>
            ) : null}
            {is_adult ? (
              <AnimeStatusBadge status="ADULT">18+</AnimeStatusBadge>
            ) : null}
          </div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
            {rows.map(detail_row => (
              <div className="contents" key={detail_row[0]}>
                <dt className="text-muted-foreground">{detail_row[0]}</dt>
                <dd className="min-w-0 break-words">{detail_row[1]}</dd>
              </div>
            ))}
          </dl>
          {normalized_body_description ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {normalized_body_description}
            </p>
          ) : null}
          <DialogFooter>
            {actions}
            {safe_anilist_url ? (
              <Button asChild>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={safe_anilist_url}
                >
                  ดูข้อมูลบน AniList
                  <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
                </a>
              </Button>
            ) : null}
          </DialogFooter>
        </div>
      </div>
    </DialogContent>
  );
}

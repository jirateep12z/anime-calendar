import { ExternalLinkIcon, XIcon } from 'lucide-react';
import Image from 'next/image';

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
      className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl"
    >
      <div className="brand-screen relative isolate overflow-hidden">
        {cover_image_url !== null ? (
          <Image
            aria-hidden="true"
            alt=""
            src={cover_image_url}
            fill
            sizes="768px"
            quality={70}
            className="absolute inset-0 z-0 scale-105 object-cover opacity-50 blur-sm"
          />
        ) : null}
        <div
          aria-hidden="true"
          className="from-background/98 via-background/85 to-background/60 absolute inset-0 z-10 bg-linear-to-r"
        />
        <div className="relative z-20 flex gap-4 p-5 pr-12 sm:gap-6 sm:p-6 sm:pr-14">
          <div
            data-slot="anime-detail-cover"
            className="w-24 shrink-0 self-start overflow-hidden rounded-lg border sm:w-32"
          >
            <ScheduleCover
              cover_image_url={cover_image_url}
              title={title}
              sizes="128px"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:justify-end">
            <DialogHeader className="min-w-0">
              <DialogTitle className="text-xl leading-tight font-bold sm:text-2xl">
                {title}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
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
          </div>
        </div>
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3 z-30"
          >
            <XIcon aria-hidden="true" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:p-6">
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
    </DialogContent>
  );
}

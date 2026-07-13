import { ExternalLinkIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { BookmarkButton } from '@/features/anime-notifications/components/bookmark-button';
import type { BookmarkCatalogEntry } from '@/features/anime-notifications/types/notification';
import { NormalizeAnimeDescription } from '../utils/anime-description';
import { NormalizeHttpUrl } from '../utils/external-url';
import { ScheduleCover } from './schedule-cover';

export type AnimeDetailDialogRow = readonly [label: string, value: string];

interface AnimeDetailDialogLayoutProps {
  readonly anilist_media_id: number;
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
  readonly bookmark_catalog_entry?: BookmarkCatalogEntry;
}

export function AnimeDetailDialogLayout({
  anilist_media_id,
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
  bookmark_catalog_entry
}: AnimeDetailDialogLayoutProps) {
  const safe_anilist_url = NormalizeHttpUrl(anilist_url);
  const normalized_body_description =
    NormalizeAnimeDescription(body_description);

  return (
    <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:min-h-[32rem] sm:max-w-3xl">
      <div className="grid gap-6 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <div
          data-slot="anime-detail-cover"
          className="mx-auto h-72 w-48 self-stretch overflow-hidden rounded-lg sm:h-full"
        >
          <ScheduleCover
            cover_image_url={cover_image_url}
            title={title}
            className="!aspect-auto h-full w-full"
            sizes="192px"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="pr-8 text-xl">{title}</DialogTitle>
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
            {is_adult ? <Badge variant="adult">18+</Badge> : null}
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
            <BookmarkButton
              anilist_media_id={anilist_media_id}
              title={title}
              catalog_entry={bookmark_catalog_entry}
            />
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

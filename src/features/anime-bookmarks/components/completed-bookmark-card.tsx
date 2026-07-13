import { StarIcon, Trash2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { NormalizeAnimeDescription } from '@/features/anime-schedule';
import {
  AnimeStatusBadge,
  ScheduleCover
} from '@/features/anime-schedule/client';
import { FormatCompletedBookmarkReleasePeriod } from '../services/completed-bookmark-view';

import type { BookmarkCatalogEntry } from '../types/bookmark';

interface CompletedBookmarkCardProps {
  readonly catalog_entry: BookmarkCatalogEntry;
  readonly is_pending: boolean;
  readonly HandleOpen: (catalog_entry: BookmarkCatalogEntry) => void;
  readonly HandleRemove: (catalog_entry: BookmarkCatalogEntry) => void;
}

export function CompletedBookmarkCard({
  catalog_entry,
  is_pending,
  HandleOpen,
  HandleRemove
}: CompletedBookmarkCardProps) {
  const secondary_title = [
    catalog_entry.title.romaji,
    catalog_entry.title.native
  ].find(title => title !== null && title !== catalog_entry.title.primary);
  const description = NormalizeAnimeDescription(catalog_entry.description);
  const has_partial_period =
    (catalog_entry.season == null) !== (catalog_entry.season_year == null);

  return (
    <li className="min-w-0">
      <Card className="relative h-full p-0 transition-transform focus-within:ring-3 focus-within:outline-none hover:-translate-y-0.5 motion-reduce:transform-none">
        <button
          type="button"
          className="grid h-full w-full grid-cols-[7rem_minmax(0,1fr)] items-stretch text-left focus-visible:outline-none sm:grid-cols-[8rem_minmax(0,1fr)]"
          aria-label={'เปิดรายละเอียด ' + catalog_entry.title.primary}
          onClick={() => HandleOpen(catalog_entry)}
        >
          <ScheduleCover
            cover_image_url={catalog_entry.cover_image_url}
            title={catalog_entry.title.primary}
            className="!aspect-auto h-full min-h-52 w-full shrink-0 sm:w-full"
            sizes="(max-width: 639px) 112px, 128px"
          />
          <div className="flex min-h-52 min-w-0 flex-col gap-3 p-4">
            <CardHeader className="min-w-0 p-0">
              <CardTitle className="line-clamp-2 leading-snug">
                {catalog_entry.title.primary}
              </CardTitle>
              {secondary_title !== undefined ? (
                <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                  {secondary_title}
                </CardDescription>
              ) : null}
            </CardHeader>
            {description ? (
              <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
                {description}
              </p>
            ) : null}
            <CardContent className="flex flex-col gap-2 p-0">
              {catalog_entry.total_episodes !== null ? (
                <span className="font-sans text-xl font-bold tabular-nums">
                  {catalog_entry.total_episodes.toLocaleString('th-TH')}
                  <span className="text-sm font-normal">{' ตอน'}</span>
                </span>
              ) : null}
              {has_partial_period ? (
                <span className="text-muted-foreground text-sm">
                  {FormatCompletedBookmarkReleasePeriod(catalog_entry)}
                </span>
              ) : null}
              {is_pending ? (
                <span role="status" className="text-muted-foreground text-xs">
                  {'รอซิงก์'}
                </span>
              ) : null}
            </CardContent>
            <CardFooter className="mt-auto flex flex-wrap gap-1.5 p-0">
              <Badge variant="secondary">{'จบแล้ว'}</Badge>
              {catalog_entry.format !== null ? (
                <Badge variant="outline">
                  {catalog_entry.format.replaceAll('_', ' ')}
                </Badge>
              ) : null}
              {catalog_entry.average_score !== null ? (
                <Badge variant="secondary">
                  <StarIcon data-icon="inline-start" aria-hidden="true" />
                  {catalog_entry.average_score}
                  {'%'}
                </Badge>
              ) : null}
              {catalog_entry.is_adult ? (
                <AnimeStatusBadge status="ADULT">{'18+'}</AnimeStatusBadge>
              ) : null}
            </CardFooter>
          </div>
        </button>
        <div className="bg-background/90 absolute top-2 left-2 rounded-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            disabled={is_pending}
            aria-busy={is_pending}
            aria-label={
              'นำ ' + catalog_entry.title.primary + ' ออกจากบุ๊กมาร์ก'
            }
            onClick={() => HandleRemove(catalog_entry)}
          >
            {is_pending ? (
              <Spinner aria-hidden="true" />
            ) : (
              <Trash2Icon aria-hidden="true" />
            )}
          </Button>
        </div>
      </Card>
    </li>
  );
}

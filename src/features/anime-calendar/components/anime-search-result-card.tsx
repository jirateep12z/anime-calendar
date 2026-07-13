import { StarIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { BookmarkButton } from '@/features/anime-notifications/components/bookmark-button';
import { ScheduleCover } from './schedule-cover';

import type { AnimeSearchResult } from '../types/anime-search';

interface AnimeSearchResultCardProps {
  readonly search_result: AnimeSearchResult;
  readonly HandleOpen: (search_result: AnimeSearchResult) => void;
}

function FormatFormatLabel(format: string | null): string {
  if (format === null) return 'ไม่ระบุรูปแบบ';

  return format.replaceAll('_', ' ');
}

function StripDescription(description: string | null): string {
  if (description === null) return 'ยังไม่มีคำอธิบายเรื่องนี้';
  const plain_text = description
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return plain_text.length > 180 ? `${plain_text.slice(0, 180)}…` : plain_text;
}

export function AnimeSearchResultCard({
  search_result,
  HandleOpen
}: AnimeSearchResultCardProps) {
  const { title } = search_result;
  const secondary_title = title.romaji ?? title.native;

  return (
    <article className="bg-card grid grid-cols-[minmax(0,1fr)_auto] items-start rounded-xl border p-3 transition-transform focus-within:ring-3 focus-within:outline-none hover:-translate-y-0.5 motion-reduce:transform-none">
      <button
        type="button"
        className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] gap-3 text-left focus-visible:outline-none"
        onClick={() => HandleOpen(search_result)}
      >
        <span className="sr-only">เปิดรายละเอียด {title.primary}</span>
        <ScheduleCover
          cover_image_url={search_result.cover_image_url}
          title={title.primary}
          className="!aspect-auto h-24 w-16 shrink-0 rounded-lg"
          sizes="64px"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
                {title.primary}
              </h3>
              {secondary_title && secondary_title !== title.primary ? (
                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                  {secondary_title}
                </p>
              ) : null}
            </div>
            {search_result.is_adult ? <Badge variant="adult">18+</Badge> : null}
          </div>
          <p className="text-muted-foreground line-clamp-1 text-xs leading-relaxed">
            {StripDescription(search_result.description)}
          </p>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span>{FormatFormatLabel(search_result.format)}</span>
            {search_result.episode_count !== null ? (
              <span>{search_result.episode_count} ตอน</span>
            ) : null}
            {search_result.average_score !== null ? (
              <span className="inline-flex items-center gap-1">
                <StarIcon className="size-3 fill-current" aria-hidden="true" />
                {search_result.average_score}%
              </span>
            ) : null}
            {search_result.popularity !== null ? (
              <span>
                ผู้ติดตาม {search_result.popularity.toLocaleString('th-TH')}
              </span>
            ) : null}
          </div>
        </div>
      </button>
      <BookmarkButton
        anilist_media_id={search_result.anilist_media_id}
        title={title.primary}
      />
    </article>
  );
}

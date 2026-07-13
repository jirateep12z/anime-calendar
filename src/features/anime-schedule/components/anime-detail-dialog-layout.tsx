'use client';

import { ExternalLinkIcon, XIcon } from 'lucide-react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle
} from '@/components/ui/drawer';
import { UseIsCompactViewport } from '@/hooks/use-compact-viewport';
import { NormalizeAnimeDescription } from '../utils/anime-description';
import { NormalizeHttpUrl } from '../utils/external-url';
import { AnimeStatusBadge } from './anime-status-badge';
import { ScheduleCover } from './schedule-cover';

import type { AnimationEvent, ComponentType, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Vaul's close transition is 500ms; this only guards against a missing animationend event.
const CLOSE_ANIMATION_FALLBACK_MS = 600;

export type AnimeDetailDialogRow = readonly [label: string, value: string];

interface AnimeDetailPrimitives {
  readonly Title: ComponentType<{
    readonly className?: string;
    readonly children?: ReactNode;
  }>;
  readonly Description: ComponentType<{ readonly children?: ReactNode }>;
  readonly Close: ComponentType<{
    readonly asChild?: boolean;
    readonly children?: ReactNode;
  }>;
}

const DIALOG_PRIMITIVES: AnimeDetailPrimitives = {
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose
};

const DRAWER_PRIMITIVES: AnimeDetailPrimitives = {
  Title: DrawerTitle,
  Description: DrawerDescription,
  Close: DrawerClose
};

interface AnimeDetailBodyProps {
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

interface AnimeDetailDialogLayoutProps extends AnimeDetailBodyProps {
  readonly HandleClose: () => void;
}

export function AnimeDetailDialogLayout({
  HandleClose,
  ...body_props
}: AnimeDetailDialogLayoutProps) {
  const is_compact_viewport = UseIsCompactViewport();
  const [is_open, SetIsOpen] = useState(true);
  const has_notified_close_ref = useRef(false);

  const NotifyClose = useCallback(() => {
    if (has_notified_close_ref.current) return;
    has_notified_close_ref.current = true;
    HandleClose();
  }, [HandleClose]);

  useEffect(() => {
    if (is_open) return;
    const fallback_timeout_id = window.setTimeout(
      NotifyClose,
      CLOSE_ANIMATION_FALLBACK_MS
    );

    return () => window.clearTimeout(fallback_timeout_id);
  }, [is_open, NotifyClose]);

  function HandleOpenChange(next_is_open: boolean) {
    if (!next_is_open) SetIsOpen(false);
  }

  function HandleDrawerAnimationEnd(is_drawer_open: boolean) {
    if (!is_drawer_open) NotifyClose();
  }

  function HandleDialogAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.currentTarget.dataset.state === 'closed') NotifyClose();
  }

  if (is_compact_viewport) {
    return (
      <Drawer
        open={is_open}
        direction="bottom"
        onAnimationEnd={HandleDrawerAnimationEnd}
        onOpenChange={HandleOpenChange}
      >
        <DrawerContent>
          <div className="mt-4 overflow-y-auto">
            <AnimeDetailBody {...body_props} primitives={DRAWER_PRIMITIVES} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={is_open} onOpenChange={HandleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl"
        onAnimationEnd={HandleDialogAnimationEnd}
      >
        <AnimeDetailBody {...body_props} primitives={DIALOG_PRIMITIVES} />
      </DialogContent>
    </Dialog>
  );
}

function AnimeDetailBody({
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
  actions,
  primitives
}: AnimeDetailBodyProps & { readonly primitives: AnimeDetailPrimitives }) {
  const safe_anilist_url = NormalizeHttpUrl(anilist_url);
  const normalized_body_description =
    NormalizeAnimeDescription(body_description);

  return (
    <>
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
              <primitives.Title className="text-xl leading-tight font-bold sm:text-2xl">
                {title}
              </primitives.Title>
              <primitives.Description>{description}</primitives.Description>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              {format ? (
                <Badge variant="outline" className="rounded-sm">
                  {format}
                </Badge>
              ) : null}
              {episode_label ? (
                <Badge variant="secondary" className="rounded-sm">
                  {episode_label}
                </Badge>
              ) : null}
              {status_label ? (
                <Badge variant="secondary" className="rounded-sm">
                  {status_label}
                </Badge>
              ) : null}
              {is_adult ? (
                <AnimeStatusBadge status="ADULT">18+</AnimeStatusBadge>
              ) : null}
            </div>
          </div>
        </div>
        <primitives.Close asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3 z-30"
          >
            <XIcon aria-hidden="true" />
            <span className="sr-only">Close</span>
          </Button>
        </primitives.Close>
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
        <DialogFooter className="flex-row justify-end">
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
    </>
  );
}

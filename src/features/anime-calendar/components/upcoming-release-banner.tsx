'use client';

import { CalendarClockIcon } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem
} from '@/components/ui/carousel';
import { Cn } from '@/lib/utils';
import { AIRING_BADGE_CLASS_NAME } from '../constants/schedule';
import { UseCalendarTime } from '../hooks/use-current-time';
import { FormatScheduleCountdown } from '../utils/countdown';
import { FormatScheduleDayLabel } from '../utils/schedule-date-label';
import {
  CalculateBroadcastStatus,
  FormatBangkokTime
} from '../utils/schedule-time';

import type { ScheduleEntry } from '../types/schedule';

const AUTOPLAY_INTERVAL_MILLISECONDS = 6_000;

interface UpcomingReleaseBannerProps {
  readonly schedule_entries: readonly ScheduleEntry[];
  readonly HandleOpenEntry: (schedule_entry: ScheduleEntry) => void;
}

export function UpcomingReleaseBanner({
  schedule_entries,
  HandleOpenEntry
}: UpcomingReleaseBannerProps) {
  const now_seconds = UseCalendarTime();
  const [carousel_api, SetCarouselApi] = useState<CarouselApi>();
  const [selected_slide_index, SetSelectedSlideIndex] = useState(0);
  const [is_hover_paused, SetIsHoverPaused] = useState(false);
  const [is_pointer_paused, SetIsPointerPaused] = useState(false);
  const [is_detail_focus_paused, SetIsDetailFocusPaused] = useState(false);
  const [is_reduced_motion, SetIsReducedMotion] = useState(false);
  const slide_count = schedule_entries.length;
  const is_autoplay_paused =
    is_hover_paused ||
    is_pointer_paused ||
    is_detail_focus_paused ||
    is_reduced_motion;

  const HandleSelect = useCallback((selected_carousel_api: CarouselApi) => {
    if (!selected_carousel_api) {
      return;
    }

    SetSelectedSlideIndex(selected_carousel_api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!carousel_api) {
      return;
    }

    carousel_api.on('select', HandleSelect);
    carousel_api.on('reInit', HandleSelect);

    return () => {
      carousel_api.off('select', HandleSelect);
      carousel_api.off('reInit', HandleSelect);
    };
  }, [carousel_api, HandleSelect]);

  useEffect(() => {
    if (!carousel_api || slide_count <= 1 || is_autoplay_paused) {
      return;
    }

    const timeout_id = window.setTimeout(() => {
      carousel_api.scrollNext();
    }, AUTOPLAY_INTERVAL_MILLISECONDS);

    return () => {
      window.clearTimeout(timeout_id);
    };
  }, [carousel_api, is_autoplay_paused, selected_slide_index, slide_count]);

  useEffect(() => {
    if (!carousel_api) {
      return;
    }

    const HandlePointerDown = () => {
      SetIsPointerPaused(true);
    };
    const HandlePointerUp = () => {
      SetIsPointerPaused(false);
    };

    carousel_api.on('pointerDown', HandlePointerDown);
    carousel_api.on('pointerUp', HandlePointerUp);

    return () => {
      carousel_api.off('pointerDown', HandlePointerDown);
      carousel_api.off('pointerUp', HandlePointerUp);
    };
  }, [carousel_api]);

  useEffect(() => {
    const motion_preference_query = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
    const HandleMotionPreferenceChange = () => {
      SetIsReducedMotion(motion_preference_query.matches);
    };

    HandleMotionPreferenceChange();
    motion_preference_query.addEventListener(
      'change',
      HandleMotionPreferenceChange
    );

    return () => {
      motion_preference_query.removeEventListener(
        'change',
        HandleMotionPreferenceChange
      );
    };
  }, []);

  if (slide_count === 0) {
    return (
      <section
        aria-labelledby="upcoming-release-title"
        className="border-border bg-card text-card-foreground rounded-xl border p-5 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <CalendarClockIcon
            className="text-muted-foreground size-5"
            aria-hidden="true"
          />
          <div>
            <h2 id="upcoming-release-title" className="font-semibold">
              กำลังรอออกอากาศ
            </h2>
            <p className="text-muted-foreground text-sm">
              ยังไม่มีรายการที่กำลังจะออกอากาศ
            </p>
          </div>
        </div>
      </section>
    );
  }

  const HandleDotClick = (slide_index: number) => {
    carousel_api?.scrollTo(slide_index);
  };

  return (
    <Carousel
      setApi={SetCarouselApi}
      opts={{ loop: slide_count > 1 }}
      aria-label="รายการที่กำลังจะออกอากาศ"
      data-testid="upcoming-release-banner"
      className="relative isolate overflow-hidden rounded-xl border border-white/10 bg-slate-950 text-white"
      onMouseEnter={() => SetIsHoverPaused(true)}
      onMouseLeave={() => SetIsHoverPaused(false)}
    >
      <CarouselContent className="ml-0">
        {schedule_entries.map((schedule_entry, slide_index) => {
          const broadcast_status = CalculateBroadcastStatus(
            schedule_entry,
            now_seconds
          );
          const is_airing = broadcast_status === 'AIRING';
          const status_label = is_airing ? 'กำลังออกอากาศ' : 'กำลังรอออกอากาศ';
          const status_variant = is_airing ? 'airing' : 'upcoming';
          const title_id = `upcoming-release-title-${schedule_entry.anilist_schedule_id}`;

          return (
            <CarouselItem
              key={schedule_entry.anilist_schedule_id}
              className="relative isolate overflow-hidden pl-0"
              aria-labelledby={title_id}
            >
              {schedule_entry.cover_image_url ? (
                <Image
                  aria-hidden="true"
                  alt=""
                  src={schedule_entry.cover_image_url}
                  fill
                  sizes="(max-width: 1279px) 100vw, 1280px"
                  quality={70}
                  priority={slide_index === 0}
                  className="absolute inset-0 z-0 h-full w-full object-cover opacity-70"
                />
              ) : null}
              <div
                aria-hidden="true"
                className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.84)_52%,rgba(2,6,23,0.72)_100%)]"
              />
              <div className="relative z-20 flex min-h-64 flex-col justify-between gap-8 p-6 pb-12 sm:min-h-72 sm:p-8 sm:pb-12 lg:flex-row lg:items-end">
                <div className="max-w-2xl space-y-4">
                  <div className="space-y-2">
                    <h2
                      id={title_id}
                      className="line-clamp-2 text-2xl font-bold tracking-tight sm:text-4xl"
                    >
                      {schedule_entry.title.primary}
                    </h2>
                    <p className="text-sm text-slate-200 sm:text-base">
                      {FormatScheduleDayLabel(schedule_entry.airing_date)} · ตอน{' '}
                      {schedule_entry.episode_number}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-100">
                    <span className="text-lg font-semibold tabular-nums">
                      {schedule_entry.airing_time}
                      <span className="text-xs font-normal"> น.</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {FormatBangkokTime(schedule_entry.airing_at)} น. เวลาไทย
                    </span>
                    <Badge
                      variant={status_variant}
                      className={
                        is_airing ? AIRING_BADGE_CLASS_NAME : undefined
                      }
                    >
                      {status_label}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                  <p className="text-xs tracking-wide text-slate-300">
                    {is_airing ? 'เหลือเวลา' : 'เริ่มในอีก'}
                  </p>
                  <p className="font-sans text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                    {FormatScheduleCountdown(schedule_entry, now_seconds)}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onFocus={() => SetIsDetailFocusPaused(true)}
                    onBlur={() => SetIsDetailFocusPaused(false)}
                    onClick={() => HandleOpenEntry(schedule_entry)}
                  >
                    ดูรายละเอียด
                  </Button>
                </div>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      {slide_count > 1 ? (
        <div
          className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2"
          role="group"
          aria-label="เลือกอนิเมะที่ฉายเวลาเดียวกัน"
        >
          {schedule_entries.map((schedule_entry, slide_index) => {
            const is_selected = slide_index === selected_slide_index;

            return (
              <button
                key={schedule_entry.anilist_schedule_id}
                type="button"
                aria-current={is_selected ? 'true' : undefined}
                aria-label={`แสดง ${schedule_entry.title.primary}`}
                className={Cn(
                  'size-2.5 rounded-full border border-white/70 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none motion-reduce:transition-none',
                  is_selected ? 'bg-white' : 'bg-white/30 hover:bg-white/60'
                )}
                onClick={() => HandleDotClick(slide_index)}
              />
            );
          })}
        </div>
      ) : null}
    </Carousel>
  );
}

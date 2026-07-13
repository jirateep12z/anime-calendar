'use client';

import { CalendarClockIcon } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem
} from '@/components/ui/carousel';
import {
  CalculateBroadcastStatus,
  FormatBangkokTime,
  FormatScheduleCountdownDuration,
  FormatScheduleDayLabel
} from '@/features/anime-schedule';
import { AnimeStatusBadge } from '@/features/anime-schedule/client';
import { Cn } from '@/lib/utils';
import { UseCalendarTime } from '../hooks/use-current-time';

import type { ScheduleEntry } from '@/features/anime-schedule';

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
        className="brand-screen rounded-xl border p-5 sm:p-6"
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
      className="brand-screen relative isolate overflow-hidden rounded-xl border"
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
                  sizes="(min-width: 1536px) 1488px, (min-width: 1024px) calc(100vw - 48px), calc(100vw - 32px)"
                  quality={70}
                  priority={slide_index === 0}
                  className="absolute inset-0 z-0 h-full w-full scale-105 object-cover opacity-50 blur-sm"
                />
              ) : null}
              <div
                aria-hidden="true"
                className="from-background/98 via-background/85 to-background/60 absolute inset-0 z-10 bg-linear-to-r"
              />
              <div className="relative z-20 flex min-h-64 flex-col justify-between gap-8 p-6 pb-12 sm:min-h-72 sm:p-8 sm:pb-12 lg:flex-row lg:items-end">
                <div className="max-w-2xl space-y-4">
                  <div className="space-y-2">
                    <p
                      className="flex items-center gap-2 text-xs font-bold tracking-widest"
                      aria-hidden="true"
                    >
                      {is_airing ? (
                        <>
                          <span className="on-air-dot inline-block size-2" />
                          <span className="text-(color:--brand-on-air)">
                            ON AIR
                          </span>
                        </>
                      ) : (
                        <span className="text-primary">NEXT UP</span>
                      )}
                    </p>
                    <h2
                      id={title_id}
                      className="line-clamp-2 text-2xl font-bold tracking-tight sm:text-4xl"
                    >
                      {schedule_entry.title.primary}
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {FormatScheduleDayLabel(schedule_entry.airing_date)} · ตอน{' '}
                      {schedule_entry.episode_number}
                    </p>
                  </div>
                  <div className="text-foreground flex flex-wrap items-center gap-2 text-sm">
                    <span>
                      เริ่ม{' '}
                      <span className="text-lg font-bold tabular-nums">
                        {FormatBangkokTime(schedule_entry.airing_at)}
                      </span>
                      <span className="text-xs"> น.</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      จบประมาณ{' '}
                      <span className="text-lg font-bold tabular-nums">
                        {FormatBangkokTime(schedule_entry.ends_at)}
                      </span>
                      <span className="text-xs"> น.</span>
                    </span>
                    <AnimeStatusBadge
                      status={is_airing ? 'AIRING' : 'UPCOMING'}
                    >
                      {status_label}
                    </AnimeStatusBadge>
                  </div>
                </div>
                <div className="flex shrink-0 items-end gap-6">
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <p className="text-muted-foreground text-xs tracking-wide">
                      {is_airing ? 'จบในอีก' : 'เริ่มในอีก'}
                    </p>
                    <p className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                      {FormatScheduleCountdownDuration(
                        schedule_entry,
                        now_seconds
                      )}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onBlur={() => SetIsDetailFocusPaused(false)}
                      onClick={() => HandleOpenEntry(schedule_entry)}
                      onFocus={() => SetIsDetailFocusPaused(true)}
                    >
                      ดูรายละเอียด
                    </Button>
                  </div>
                  {schedule_entry.cover_image_url ? (
                    <div
                      className="relative hidden aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-lg border lg:block"
                      aria-hidden="true"
                    >
                      <Image
                        alt=""
                        src={schedule_entry.cover_image_url}
                        fill
                        sizes="128px"
                        quality={75}
                        className="object-cover"
                      />
                    </div>
                  ) : null}
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
                  'border-foreground/70 focus-visible:ring-ring focus-visible:ring-offset-background size-2.5 rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none',
                  is_selected
                    ? 'bg-foreground'
                    : 'bg-foreground/30 hover:bg-foreground/60'
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

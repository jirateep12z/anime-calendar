import { FetchAniListSchedule } from '@/features/anime-calendar/api/anilist-client';
import { CalendarClient } from '@/features/anime-calendar/components/calendar-client';
import { TransformAniListSchedules } from '@/features/anime-calendar/services/transform-schedule';
import { CreateBangkokScheduleRange } from '@/features/anime-calendar/utils/schedule-time';
import { SITE_ORIGIN } from '@/lib/site-metadata';

import type { ScheduleInitialData } from '@/features/anime-calendar/types/schedule';
import type { Metadata } from 'next';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: 'Anime Calendar | ตารางอนิเมะ',
  description: 'ตารางออกอากาศอนิเมะ 7 วันตามเวลาไทย',
  alternates: {
    canonical: '/calendar/'
  },
  openGraph: {
    title: 'Anime Calendar | ตารางอนิเมะ',
    description: 'ตารางออกอากาศอนิเมะ 7 วันตามเวลาไทย',
    type: 'website',
    locale: 'th_TH',
    siteName: 'Anime Calendar',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Anime Calendar upcoming release'
      }
    ]
  }
};

const WEBSITE_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Anime Calendar',
  description: 'ตารางออกอากาศอนิเมะ 7 วันตามเวลาไทย',
  url: SITE_ORIGIN.toString(),
  inLanguage: 'th-TH'
} as const;

async function FetchInitialScheduleData(): Promise<ScheduleInitialData | null> {
  const now = new Date();
  const schedule_range = CreateBangkokScheduleRange(now);

  try {
    const raw_schedules = await FetchAniListSchedule(
      schedule_range,
      AbortSignal.timeout(12_000)
    );
    const schedule_entries = TransformAniListSchedules(raw_schedules);

    return Object.freeze({
      range_start_date: schedule_range.range_start_date,
      schedule_entries,
      cached_at: Date.now()
    });
  } catch {
    return null;
  }
}

export default async function CalendarPage() {
  await connection();
  const initial_schedule_data = await FetchInitialScheduleData();
  const initial_now_seconds =
    initial_schedule_data === null
      ? 0
      : Math.floor(initial_schedule_data.cached_at / 1000);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(WEBSITE_STRUCTURED_DATA)
        }}
      />
      <CalendarClient
        initial_schedule_data={initial_schedule_data}
        initial_now_seconds={initial_now_seconds}
      />
    </>
  );
}

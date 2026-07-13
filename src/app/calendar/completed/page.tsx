import { connection } from 'next/server';

import {
  COMPLETED_PAGE_COPY,
  GetCurrentAnimeSeason
} from '@/features/anime-seasons';
import { AnimeSeasonsClient } from '@/features/anime-seasons/client';

import type { Metadata } from 'next';

const PAGE_TITLE = 'Anime Calendar | อนิเมะที่จบแล้ว';
const PAGE_DESCRIPTION =
  'อนิเมะที่จบแล้วตามฤดูกาล เลือกปีและฤดูกาลเพื่อดูอนิเมะที่ออกอากาศจบแล้ว พร้อมรายละเอียดและบุ๊กมาร์ก';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/calendar/completed' },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: 'website',
    locale: 'th_TH',
    siteName: 'Anime Calendar',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Anime Calendar finished seasonal catalog'
      }
    ]
  }
};

export default async function CompletedAnimePage() {
  await connection();
  const default_selection = GetCurrentAnimeSeason(new Date());

  return (
    <AnimeSeasonsClient
      default_selection={default_selection}
      media_status="FINISHED"
      page_copy={COMPLETED_PAGE_COPY}
    />
  );
}

import { CompletedBookmarksClient } from '@/features/anime-calendar/client';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เรื่องที่จบแล้ว | Anime Calendar',
  description: 'บุ๊กมาร์กของอนิเมะที่ออกอากาศจบแล้วบนอุปกรณ์นี้',
  alternates: {
    canonical: '/calendar/completed'
  }
};

export default function CompletedBookmarksPage() {
  return <CompletedBookmarksClient />;
}

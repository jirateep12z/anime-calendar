import { connection } from 'next/server';

import { GetCurrentAnimeSeason } from '@/features/anime-seasons';
import { AnimeSeasonsClient } from '@/features/anime-seasons/client';

import type { Metadata } from 'next';

const PAGE_TITLE =
  'Anime Calendar | \u0e2d\u0e19\u0e34\u0e40\u0e21\u0e30\u0e15\u0e32\u0e21\u0e24\u0e14\u0e39\u0e01\u0e32\u0e25';
const PAGE_DESCRIPTION =
  '\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e1b\u0e35\u0e41\u0e25\u0e30\u0e24\u0e14\u0e39\u0e01\u0e32\u0e25\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e14\u0e39\u0e2d\u0e19\u0e34\u0e40\u0e21\u0e30 \u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e41\u0e25\u0e30\u0e1a\u0e38\u0e4a\u0e01\u0e21\u0e32\u0e23\u0e4c\u0e01';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/calendar/seasons' },
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
        alt: 'Anime Calendar seasonal catalog'
      }
    ]
  }
};

export default async function AnimeSeasonsPage() {
  await connection();
  const default_selection = GetCurrentAnimeSeason(new Date());

  return <AnimeSeasonsClient default_selection={default_selection} />;
}

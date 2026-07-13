import { SITE_ORIGIN } from '@/lib/site-metadata';

import type { MetadataRoute } from 'next';

export default function Sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL('/calendar/', SITE_ORIGIN).toString(),
      changeFrequency: 'hourly',
      priority: 1
    }
  ];
}

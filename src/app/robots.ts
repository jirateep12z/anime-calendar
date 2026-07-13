import { SITE_ORIGIN } from '@/lib/site-metadata';

import type { MetadataRoute } from 'next';

export default function Robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: new URL('/sitemap.xml', SITE_ORIGIN).toString()
  };
}

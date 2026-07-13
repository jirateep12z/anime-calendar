import type { MetadataRoute } from 'next';

export default function Manifest(): MetadataRoute.Manifest {
  return {
    name: 'Anime Calendar',
    short_name: 'Anime Calendar',
    description: 'ตารางออกอากาศอนิเมะตามเวลาไทย',
    start_url: '/calendar/',
    display: 'standalone',
    lang: 'th',
    background_color: '#ffffff',
    theme_color: '#171717',
    icons: [
      {
        src: '/icons/anime-calendar-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/anime-calendar-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/icons/anime-calendar-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}

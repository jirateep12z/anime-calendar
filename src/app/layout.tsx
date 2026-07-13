import { Inter, Noto_Sans_Thai } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

import { AppLoadingBoundary } from '@/components/app-loading-boundary';
import { SITE_ORIGIN } from '@/lib/site-metadata';

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: SITE_ORIGIN,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Anime Calendar'
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#252525' }
  ]
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

const noto_sans_thai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  display: 'swap',
  variable: '--font-noto-sans-thai'
});

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${inter.variable} ${noto_sans_thai.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function () {
            try {
              var stored_theme = localStorage.getItem('anime-calendar:theme-preference:v1');
              var parsed_theme = stored_theme ? JSON.parse(stored_theme) : null;
              var selected_theme = parsed_theme && parsed_theme.theme;
              if (
                selected_theme === 'dark' ||
                ((!selected_theme || selected_theme === 'system') &&
                  window.matchMedia('(prefers-color-scheme: dark)').matches)
              ) {
                document.documentElement.classList.add('dark');
              }
            } catch {}
          })();`}
        </Script>
        <AppLoadingBoundary>{children}</AppLoadingBoundary>
      </body>
    </html>
  );
}

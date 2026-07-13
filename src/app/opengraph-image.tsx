import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { FetchUpcomingScheduleEntry } from '@/features/anime-calendar/services/fetch-upcoming-schedule-entry';

import type { ScheduleEntry } from '@/features/anime-calendar/types/schedule';

export const alt = 'Anime Calendar upcoming release';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'nodejs';
export const revalidate = 300;

const FALLBACK_IMAGE_DATA_URI = `data:image/png;base64,${readFileSync(
  join(process.cwd(), 'public/anime-mascot.png')
).toString('base64')}`;
const MAX_COVER_IMAGE_BYTES = 8_000_000;

function IsSafeImageUrl(image_url: string | null): image_url is string {
  if (image_url === null) {
    return false;
  }

  try {
    const parsed_url = new URL(image_url);

    return parsed_url.protocol === 'https:' || parsed_url.protocol === 'http:';
  } catch {
    return false;
  }
}

async function FetchImageDataUri(image_url: string | null): Promise<string> {
  if (!IsSafeImageUrl(image_url)) {
    return FALLBACK_IMAGE_DATA_URI;
  }

  try {
    const response = await fetch(image_url, {
      signal: AbortSignal.timeout(8_000)
    });
    const content_type = response.headers.get('content-type')?.split(';')[0];
    const content_length = Number(response.headers.get('content-length') ?? 0);

    if (
      !response.ok ||
      content_type?.startsWith('image/') !== true ||
      (content_length > 0 && content_length > MAX_COVER_IMAGE_BYTES)
    ) {
      return FALLBACK_IMAGE_DATA_URI;
    }

    const image_buffer = Buffer.from(await response.arrayBuffer());

    if (image_buffer.byteLength > MAX_COVER_IMAGE_BYTES) {
      return FALLBACK_IMAGE_DATA_URI;
    }

    return `data:${content_type};base64,${image_buffer.toString('base64')}`;
  } catch {
    return FALLBACK_IMAGE_DATA_URI;
  }
}

function CreateEpisodeLabel(schedule_entry: ScheduleEntry | null): string {
  if (schedule_entry === null) {
    return 'ANIME BROADCAST SCHEDULE';
  }

  return `EPISODE ${schedule_entry.episode_number} · ${schedule_entry.airing_time}`;
}

export default async function OpenGraphImage() {
  const now = new Date();
  let upcoming_schedule_entry: ScheduleEntry | null = null;

  try {
    upcoming_schedule_entry = await FetchUpcomingScheduleEntry(
      now,
      AbortSignal.timeout(12_000)
    );
  } catch {
    upcoming_schedule_entry = null;
  }

  const image_data_uri = await FetchImageDataUri(
    upcoming_schedule_entry?.cover_image_url ?? null
  );
  const title = upcoming_schedule_entry?.title.primary ?? 'Anime Calendar';
  const episode_label = CreateEpisodeLabel(upcoming_schedule_entry);

  return new ImageResponse(
    <div
      style={{
        backgroundColor: '#020617',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'flex-end',
        padding: '64px',
        position: 'relative',
        width: '100%'
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={image_data_uri}
        style={{
          height: '100%',
          left: 0,
          objectFit: 'cover',
          opacity: 0.46,
          position: 'absolute',
          top: 0,
          width: '100%'
        }}
      />
      <div
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(90deg, rgba(2,6,23,0.98) 0%, rgba(2,6,23,0.74) 55%, rgba(2,6,23,0.35) 100%)',
          inset: 0,
          position: 'absolute'
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '1020px',
          position: 'relative'
        }}
      >
        <div style={{ color: '#a9a1ff', fontSize: 28, fontWeight: 700 }}>
          UPCOMING RELEASE
        </div>
        <div
          style={{
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.1,
            marginTop: 18
          }}
        >
          {title}
        </div>
        <div style={{ color: '#d6d9e8', fontSize: 30, marginTop: 18 }}>
          {episode_label}
        </div>
      </div>
    </div>,
    { ...size }
  );
}

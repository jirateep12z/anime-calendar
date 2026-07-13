import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { CalculateBroadcastStatus } from '@/features/anime-schedule';
import { FetchUpcomingScheduleEntry } from '@/features/anime-schedule/server';

import type { ScheduleEntry } from '@/features/anime-schedule';

export const alt = 'Anime Calendar upcoming release';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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
      signal: AbortSignal.timeout(9_000)
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

const MAX_TITLE_LENGTH = 90;

function CreateEpisodeLabel(schedule_entry: ScheduleEntry | null): string {
  if (schedule_entry === null) {
    return 'ANIME BROADCAST SCHEDULE';
  }

  return `EP ${schedule_entry.episode_number} · ${schedule_entry.airing_time} (GMT+7)`;
}

function TruncateTitle(title: string): string {
  if (title.length <= MAX_TITLE_LENGTH) {
    return title;
  }

  return `${title.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`;
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
  const title = TruncateTitle(
    upcoming_schedule_entry?.title.primary ?? 'Anime Calendar'
  );
  const episode_label = CreateEpisodeLabel(upcoming_schedule_entry);
  const is_airing =
    upcoming_schedule_entry !== null &&
    CalculateBroadcastStatus(
      upcoming_schedule_entry,
      Math.floor(now.getTime() / 1000)
    ) === 'AIRING';

  return new ImageResponse(
    <div
      style={{
        alignItems: 'stretch',
        backgroundColor: '#0a0a0a',
        color: '#fafafa',
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        justifyContent: 'space-between',
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
          filter: 'blur(8px)',
          height: '100%',
          left: 0,
          objectFit: 'cover',
          opacity: 0.5,
          position: 'absolute',
          top: 0,
          transform: 'scale(1.05)',
          width: '100%'
        }}
      />
      <div
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(90deg, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.85) 55%, rgba(10,10,10,0.6) 100%)',
          height: '100%',
          left: 0,
          position: 'absolute',
          top: 0,
          width: '100%'
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          maxWidth: '720px',
          position: 'relative'
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: '14px' }}>
          <div
            style={{
              backgroundColor: '#00c950',
              borderRadius: '9999px',
              height: '16px',
              width: '16px'
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 700 }}>Anime Calendar</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {upcoming_schedule_entry !== null ? (
            <div
              style={{
                alignItems: 'center',
                color: '#00c950',
                display: 'flex',
                fontSize: 26,
                fontWeight: 700,
                gap: '12px',
                letterSpacing: '4px'
              }}
            >
              {is_airing ? (
                <div
                  style={{
                    backgroundColor: '#00c950',
                    borderRadius: '9999px',
                    height: '12px',
                    width: '12px'
                  }}
                />
              ) : null}
              <div>{is_airing ? 'ON AIR' : 'NEXT UP'}</div>
            </div>
          ) : null}
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.1,
              marginTop: 18
            }}
          >
            {title}
          </div>
          <div style={{ color: '#a1a1a1', fontSize: 30, marginTop: 18 }}>
            {episode_label}
          </div>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={image_data_uri}
        style={{
          alignSelf: 'center',
          border: '2px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          height: '450px',
          objectFit: 'cover',
          position: 'relative',
          width: '300px'
        }}
      />
    </div>,
    { ...size }
  );
}

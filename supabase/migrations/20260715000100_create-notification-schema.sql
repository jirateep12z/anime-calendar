-- Supabase migration filenames require an underscore after the timestamp.
create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create type public.notification_mode as enum ('ALL', 'BOOKMARKS');
create type public.delivery_status as enum (
  'PENDING',
  'SENT',
  'RETRYABLE_FAILED',
  'FINAL_FAILED'
);
create type public.batch_status as enum (
  'PENDING',
  'CLAIMED',
  'COMPLETED',
  'FAILED'
);

create table public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  session_token_hash text not null unique check (length(session_token_hash) = 64),
  is_notification_enabled boolean not null default false,
  notification_mode public.notification_mode not null default 'BOOKMARKS',
  is_adult_confirmed boolean not null default false,
  is_adult_content_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.notification_devices(id) on delete cascade,
  endpoint text not null,
  endpoint_hash text not null unique check (length(endpoint_hash) = 64),
  p256dh_key text not null,
  auth_key text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_succeeded_at timestamptz,
  invalidated_at timestamptz
);

create unique index push_subscriptions_one_active_per_device_idx
  on public.push_subscriptions(device_id)
  where is_active;

create table public.anime_bookmark_states (
  device_id uuid not null references public.notification_devices(id) on delete cascade,
  anilist_media_id integer not null check (anilist_media_id > 0),
  is_bookmarked boolean not null,
  client_mutation_id uuid not null,
  client_sequence bigint not null check (client_sequence > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (device_id, anilist_media_id)
);

create table public.anime_releases (
  anilist_schedule_id integer primary key check (anilist_schedule_id > 0),
  anilist_media_id integer not null check (anilist_media_id > 0),
  title text not null check (length(title) between 1 and 500),
  episode_number integer not null check (episode_number > 0),
  airing_at timestamptz not null,
  airing_time_bangkok text not null,
  is_adult boolean not null,
  cover_image_url text,
  synced_at timestamptz not null default now()
);

create index anime_releases_airing_at_idx
  on public.anime_releases(airing_at);
create index anime_releases_media_id_idx
  on public.anime_releases(anilist_media_id);

create table public.notification_batches (
  id uuid primary key default gen_random_uuid(),
  status public.batch_status not null default 'PENDING',
  delivery_count integer not null check (delivery_count between 1 and 100),
  claim_token uuid,
  claim_expires_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.notification_devices(id) on delete cascade,
  anilist_schedule_id integer not null references public.anime_releases(anilist_schedule_id) on delete cascade,
  batch_id uuid references public.notification_batches(id) on delete set null,
  status public.delivery_status not null default 'PENDING',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  claimed_at timestamptz,
  sent_at timestamptz,
  last_attempt_at timestamptz,
  error_code text,
  unique (device_id, anilist_schedule_id)
);

create index notification_deliveries_pending_idx
  on public.notification_deliveries(status, anilist_schedule_id);

create table public.notification_usage_daily (
  usage_date date primary key,
  edge_invocation_count integer not null default 0 check (edge_invocation_count >= 0),
  delivery_count integer not null default 0 check (delivery_count >= 0),
  retry_count integer not null default 0 check (retry_count >= 0),
  updated_at timestamptz not null default now()
);

create table public.api_rate_limits (
  rate_limit_key text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  primary key (rate_limit_key, window_started_at)
);

alter table public.notification_devices enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.anime_bookmark_states enable row level security;
alter table public.anime_releases enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_batches enable row level security;
alter table public.notification_usage_daily enable row level security;
alter table public.api_rate_limits enable row level security;

revoke all on table public.notification_devices from anon, authenticated;
revoke all on table public.push_subscriptions from anon, authenticated;
revoke all on table public.anime_bookmark_states from anon, authenticated;
revoke all on table public.anime_releases from anon, authenticated;
revoke all on table public.notification_deliveries from anon, authenticated;
revoke all on table public.notification_batches from anon, authenticated;
revoke all on table public.notification_usage_daily from anon, authenticated;
revoke all on table public.api_rate_limits from anon, authenticated;

grant select, insert, update, delete on table public.notification_devices to service_role;
grant select, insert, update, delete on table public.push_subscriptions to service_role;
grant select, insert, update, delete on table public.anime_bookmark_states to service_role;
grant select, insert, update, delete on table public.anime_releases to service_role;
grant select, insert, update, delete on table public.notification_deliveries to service_role;
grant select, insert, update, delete on table public.notification_batches to service_role;
grant select, insert, update, delete on table public.notification_usage_daily to service_role;
grant select, insert, update, delete on table public.api_rate_limits to service_role;

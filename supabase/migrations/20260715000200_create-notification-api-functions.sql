create or replace function public."WriteBookmarkState"(
  device_id_input uuid,
  anilist_media_id_input integer,
  is_bookmarked_input boolean,
  client_mutation_id_input uuid,
  client_sequence_input bigint
)
returns public.anime_bookmark_states
language plpgsql
security definer
set search_path = public
as $$
declare
  bookmark_state public.anime_bookmark_states;
begin
  insert into public.anime_bookmark_states(
    device_id,
    anilist_media_id,
    is_bookmarked,
    client_mutation_id,
    client_sequence
  )
  values (
    device_id_input,
    anilist_media_id_input,
    is_bookmarked_input,
    client_mutation_id_input,
    client_sequence_input
  )
  on conflict (device_id, anilist_media_id) do update
  set
    is_bookmarked = excluded.is_bookmarked,
    client_mutation_id = excluded.client_mutation_id,
    client_sequence = excluded.client_sequence,
    updated_at = now()
  where anime_bookmark_states.client_sequence < excluded.client_sequence
  returning * into bookmark_state;

  if bookmark_state is null then
    select * into strict bookmark_state
    from public.anime_bookmark_states
    where device_id = device_id_input
      and anilist_media_id = anilist_media_id_input;
  end if;

  return bookmark_state;
end;
$$;

create or replace function public."ReplacePushSubscription"(
  device_id_input uuid,
  endpoint_input text,
  endpoint_hash_input text,
  p256dh_key_input text,
  auth_key_input text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.push_subscriptions
  set
    is_active = false,
    invalidated_at = now(),
    updated_at = now()
  where device_id = device_id_input
    and is_active;

  insert into public.push_subscriptions(
    device_id,
    endpoint,
    endpoint_hash,
    p256dh_key,
    auth_key,
    is_active
  )
  values (
    device_id_input,
    endpoint_input,
    endpoint_hash_input,
    p256dh_key_input,
    auth_key_input,
    true
  )
  on conflict (endpoint_hash) do update
  set
    device_id = excluded.device_id,
    endpoint = excluded.endpoint,
    p256dh_key = excluded.p256dh_key,
    auth_key = excluded.auth_key,
    is_active = true,
    invalidated_at = null,
    updated_at = now();
end;
$$;

create or replace function public."DeletePushSubscription"(
  device_id_input uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.push_subscriptions
  where device_id = device_id_input;
$$;

create or replace function public."ConsumeApiRateLimit"(
  rate_limit_key_input text,
  request_limit_input integer,
  window_seconds_input integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_window_started_at timestamptz;
  current_request_count integer;
begin
  if length(rate_limit_key_input) not between 1 and 200
    or request_limit_input <= 0
    or window_seconds_input <= 0 then
    raise exception using errcode = '22023', message = 'Invalid rate limit input';
  end if;

  current_window_started_at := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / window_seconds_input)
    * window_seconds_input
  );

  insert into public.api_rate_limits(
    rate_limit_key,
    window_started_at,
    request_count
  )
  values (
    rate_limit_key_input,
    current_window_started_at,
    1
  )
  on conflict (rate_limit_key, window_started_at) do update
  set request_count = api_rate_limits.request_count + 1
  returning request_count into current_request_count;

  return current_request_count <= request_limit_input;
end;
$$;

revoke all on function public."WriteBookmarkState"(uuid, integer, boolean, uuid, bigint) from public, anon, authenticated;
revoke all on function public."ReplacePushSubscription"(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public."DeletePushSubscription"(uuid) from public, anon, authenticated;
revoke all on function public."ConsumeApiRateLimit"(text, integer, integer) from public, anon, authenticated;

grant execute on function public."WriteBookmarkState"(uuid, integer, boolean, uuid, bigint) to service_role;
grant execute on function public."ReplacePushSubscription"(uuid, text, text, text, text) to service_role;
grant execute on function public."DeletePushSubscription"(uuid) to service_role;
grant execute on function public."ConsumeApiRateLimit"(text, integer, integer) to service_role;

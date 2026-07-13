alter table public.notification_batches
  add column invoked_at timestamptz;

create index notification_deliveries_unbatched_idx
  on public.notification_deliveries(status, id)
  where batch_id is null
    and status in ('PENDING', 'RETRYABLE_FAILED');

create index notification_batches_invocation_idx
  on public.notification_batches(status, invoked_at)
  where status in ('PENDING', 'CLAIMED');

create or replace function public."CreateNotificationBatches"(
  now_input timestamptz default now()
)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  delivery_ids uuid[];
  created_batch_id uuid;
begin
  insert into public.notification_deliveries(device_id, anilist_schedule_id)
  select device.id, release.anilist_schedule_id
  from public.notification_devices device
  join public.push_subscriptions subscription
    on subscription.device_id = device.id
    and subscription.is_active
  join public.anime_releases release
    on release.airing_at > now_input - interval '5 minutes'
    and release.airing_at <= now_input
  left join public.anime_bookmark_states bookmark
    on bookmark.device_id = device.id
    and bookmark.anilist_media_id = release.anilist_media_id
    and bookmark.is_bookmarked
  where device.is_notification_enabled
    and (
      device.notification_mode = 'ALL'
      or bookmark.device_id is not null
    )
    and (
      not release.is_adult
      or (
        device.is_adult_confirmed
        and device.is_adult_content_visible
      )
    )
  on conflict (device_id, anilist_schedule_id) do nothing;

  loop
    select array_agg(selected_delivery.id)
    into delivery_ids
    from (
      select delivery.id
      from public.notification_deliveries delivery
      join public.anime_releases release
        on release.anilist_schedule_id = delivery.anilist_schedule_id
      where delivery.status in ('PENDING', 'RETRYABLE_FAILED')
        and delivery.batch_id is null
        and release.airing_at > now_input - interval '5 minutes'
        and release.airing_at <= now_input
      order by release.airing_at, delivery.id
      limit 100
      for update of delivery skip locked
    ) selected_delivery;

    exit when delivery_ids is null or cardinality(delivery_ids) = 0;

    insert into public.notification_batches(delivery_count)
    values (cardinality(delivery_ids))
    returning id into created_batch_id;

    update public.notification_deliveries
    set batch_id = created_batch_id,
        status = 'PENDING'
    where id = any(delivery_ids);

    return next created_batch_id;
  end loop;
end;
$$;

create or replace function public."ClaimNotificationBatch"(
  batch_id_input uuid,
  claimed_at_input timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_claim_token uuid := gen_random_uuid();
  claimed_batch_id uuid;
begin
  update public.notification_batches
  set
    status = 'CLAIMED',
    claim_token = created_claim_token,
    claim_expires_at = claimed_at_input + interval '90 seconds'
  where id = batch_id_input
    and (
      status = 'PENDING'
      or (
        status = 'CLAIMED'
        and claim_expires_at < claimed_at_input
      )
    )
  returning id into claimed_batch_id;

  if claimed_batch_id is null then
    if not exists (
      select 1 from public.notification_batches where id = batch_id_input
    ) then
      raise exception using
        errcode = 'P0002',
        message = 'Notification batch not found';
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'Notification batch is not claimable';
  end if;

  update public.notification_deliveries
  set claimed_at = claimed_at_input
  where batch_id = batch_id_input
    and status = 'PENDING';

  return created_claim_token;
end;
$$;

create or replace function public."CompleteNotificationDelivery"(
  delivery_id_input uuid,
  claim_token_input uuid,
  delivery_status_input public.delivery_status,
  error_code_input text default null,
  attempted_at_input timestamptz default now()
)
returns public.delivery_status
language plpgsql
security definer
set search_path = public
as $$
declare
  effective_status public.delivery_status;
  current_batch_id uuid;
begin
  if delivery_status_input not in ('SENT', 'RETRYABLE_FAILED', 'FINAL_FAILED') then
    raise exception using errcode = '22023', message = 'Invalid delivery completion status';
  end if;

  select delivery.batch_id
  into current_batch_id
  from public.notification_deliveries delivery
  join public.notification_batches batch on batch.id = delivery.batch_id
  where delivery.id = delivery_id_input
    and delivery.status = 'PENDING'
    and batch.status = 'CLAIMED'
    and batch.claim_token = claim_token_input
    and batch.claim_expires_at >= attempted_at_input
  for update of delivery;

  if current_batch_id is null then
    raise exception using errcode = 'P0002', message = 'Claimed delivery not found';
  end if;

  effective_status := delivery_status_input;
  if delivery_status_input = 'RETRYABLE_FAILED' and not exists (
    select 1
    from public.notification_deliveries delivery
    join public.anime_releases release using (anilist_schedule_id)
    where delivery.id = delivery_id_input
      and release.airing_at > attempted_at_input - interval '5 minutes'
  ) then
    effective_status := 'FINAL_FAILED';
  end if;

  update public.notification_deliveries
  set
    status = effective_status,
    attempt_count = attempt_count + 1,
    sent_at = case when effective_status = 'SENT' then attempted_at_input else sent_at end,
    last_attempt_at = attempted_at_input,
    error_code = case when effective_status = 'SENT' then null else left(error_code_input, 100) end,
    batch_id = case when effective_status = 'RETRYABLE_FAILED' then null else batch_id end
  where id = delivery_id_input;

  return effective_status;
end;
$$;

create or replace function public."CompleteNotificationBatch"(
  batch_id_input uuid,
  claim_token_input uuid,
  completed_at_input timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notification_batches
  set
    status = case
      when exists (
        select 1
        from public.notification_deliveries
        where batch_id = batch_id_input
          and status = 'FINAL_FAILED'
      ) then 'FAILED'::public.batch_status
      else 'COMPLETED'::public.batch_status
    end,
    completed_at = completed_at_input
  where id = batch_id_input
    and status = 'CLAIMED'
    and claim_token = claim_token_input
    and not exists (
      select 1
      from public.notification_deliveries
      where batch_id = batch_id_input
        and status = 'PENDING'
    );

  if not found then
    raise exception using errcode = 'P0001', message = 'Notification batch cannot be completed';
  end if;
end;
$$;

create or replace function public."TryConsumeNotificationInvocationBudget"(
  usage_date_input date default current_date
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  monthly_invocation_count bigint;
begin
  perform pg_advisory_xact_lock(hashtext('notification-invocation-budget'));

  select coalesce(sum(edge_invocation_count), 0)
  into monthly_invocation_count
  from public.notification_usage_daily
  where usage_date >= date_trunc('month', usage_date_input)::date
    and usage_date < (date_trunc('month', usage_date_input) + interval '1 month')::date;

  if monthly_invocation_count >= 450000 then
    return false;
  end if;

  insert into public.notification_usage_daily(usage_date, edge_invocation_count)
  values (usage_date_input, 1)
  on conflict (usage_date) do update
  set
    edge_invocation_count = notification_usage_daily.edge_invocation_count + 1,
    updated_at = now();

  return true;
end;
$$;

create or replace function public."ReadNotificationVaultSecret"(
  secret_name_input text
)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  secret_value text;
begin
  select decrypted_secret
  into secret_value
  from vault.decrypted_secrets
  where name = secret_name_input
  order by created_at desc
  limit 1;

  if secret_value is null then
    raise exception using errcode = 'P0002', message = 'Notification Vault secret not found';
  end if;

  return secret_value;
end;
$$;

create or replace function public."InvokePendingNotificationBatches"(
  now_input timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public, net
as $$
declare
  batch_record record;
  edge_function_url text;
  edge_secret text;
  invoked_count integer := 0;
begin
  update public.notification_batches
  set status = 'PENDING', claim_token = null, claim_expires_at = null
  where status = 'CLAIMED'
    and claim_expires_at < now_input;

  edge_function_url := public."ReadNotificationVaultSecret"('notification_edge_function_url');
  edge_secret := public."ReadNotificationVaultSecret"('notification_edge_secret');

  for batch_record in
    select id
    from public.notification_batches
    where status = 'PENDING'
      and (invoked_at is null or invoked_at < now_input - interval '90 seconds')
    order by created_at
    for update skip locked
  loop
    exit when not public."TryConsumeNotificationInvocationBudget"(now_input::date);

    perform net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'authorization', 'Bearer ' || edge_secret
      ),
      body := jsonb_build_object('batch_id', batch_record.id),
      timeout_milliseconds := 10000
    );

    update public.notification_batches
    set invoked_at = now_input
    where id = batch_record.id;
    invoked_count := invoked_count + 1;
  end loop;

  return invoked_count;
end;
$$;

create or replace function public."CreateAndInvokeNotificationBatches"(
  now_input timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public."CreateNotificationBatches"(now_input);
  return public."InvokePendingNotificationBatches"(now_input);
end;
$$;

create or replace function public."InvokeScheduleSync"()
returns bigint
language plpgsql
security definer
set search_path = public, net
as $$
declare
  application_url text;
  cron_secret text;
begin
  application_url := rtrim(public."ReadNotificationVaultSecret"('notification_application_url'), '/');
  cron_secret := public."ReadNotificationVaultSecret"('notification_cron_secret');

  return net.http_post(
    url := application_url || '/api/notification-jobs/sync-schedule',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
end;
$$;

create or replace function public."CleanupNotificationData"()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notification_devices
  where last_seen_at < now() - interval '90 days';

  delete from public.anime_releases
  where airing_at < now() - interval '90 days';

  delete from public.notification_batches
  where created_at < now() - interval '90 days'
    and not exists (
      select 1
      from public.notification_deliveries
      where batch_id = notification_batches.id
    );

  delete from public.notification_usage_daily
  where usage_date < current_date - 90;

  delete from public.api_rate_limits
  where window_started_at < now() - interval '1 day';
end;
$$;

revoke all on function public."CreateNotificationBatches"(timestamptz) from public, anon, authenticated;
revoke all on function public."ClaimNotificationBatch"(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public."CompleteNotificationDelivery"(uuid, uuid, public.delivery_status, text, timestamptz) from public, anon, authenticated;
revoke all on function public."CompleteNotificationBatch"(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public."TryConsumeNotificationInvocationBudget"(date) from public, anon, authenticated;
revoke all on function public."ReadNotificationVaultSecret"(text) from public, anon, authenticated;
revoke all on function public."InvokePendingNotificationBatches"(timestamptz) from public, anon, authenticated;
revoke all on function public."CreateAndInvokeNotificationBatches"(timestamptz) from public, anon, authenticated;
revoke all on function public."InvokeScheduleSync"() from public, anon, authenticated;
revoke all on function public."CleanupNotificationData"() from public, anon, authenticated;

grant execute on function public."CreateNotificationBatches"(timestamptz) to service_role;
grant execute on function public."ClaimNotificationBatch"(uuid, timestamptz) to service_role;
grant execute on function public."CompleteNotificationDelivery"(uuid, uuid, public.delivery_status, text, timestamptz) to service_role;
grant execute on function public."CompleteNotificationBatch"(uuid, uuid, timestamptz) to service_role;

select cron.schedule(
  'sync-notification-schedule',
  '*/15 * * * *',
  $cron$select public."InvokeScheduleSync"()$cron$
);
select cron.schedule(
  'dispatch-anime-notifications',
  '* * * * *',
  $cron$select public."CreateAndInvokeNotificationBatches"()$cron$
);
select cron.schedule(
  'cleanup-notification-data',
  '30 18 * * *',
  $cron$select public."CleanupNotificationData"()$cron$
);

# Supabase Notification Backend

This directory contains the database migrations and the `send-notification-batch` Edge Function behind the Anime Calendar Web Push pipeline. PostgreSQL schedules the work with pg_cron, reads its secrets from Supabase Vault, and calls both the Next.js application and the Edge Function through `pg_net`.

## Features

### Schedule Sync

- **Periodic Sync**: The `sync-notification-schedule` cron job runs every 15 minutes and sends `POST <notification_application_url>/api/notification-jobs/sync-schedule` with the cron secret as a bearer token.
- **Manual Trigger**: `select public."InvokeScheduleSync"();` queues the same request immediately and returns its `pg_net` request ID.

### Delivery Dispatch

- **Per-Minute Dispatch**: The `dispatch-anime-notifications` cron job runs every minute and creates one delivery per device and release for releases that aired within the last 5 minutes.
- **Device Eligibility**: A device receives a delivery only when notifications are enabled, it has an active push subscription, and its mode is `ALL` or the anime is bookmarked on that device.
- **Adult Guard**: 18+ releases are delivered only to devices that confirmed and enabled adult content.
- **Batching**: Deliveries are grouped into batches of up to 100 and sent to the Edge Function one request per batch.
- **Claim Recovery**: Batches claimed for more than 90 seconds without completing return to `PENDING` and are invoked again.
- **Monthly Invocation Budget**: Dispatch stops invoking the Edge Function after 450,000 invocations in the current calendar month, counted in `notification_usage_daily`.

### Edge Function

- **Request Validation**: Accepts only `POST` requests with `Authorization: Bearer <NOTIFICATION_EDGE_SECRET>` and a JSON body of at most 1,024 bytes containing exactly one UUID `batch_id`.
- **Concurrent Push**: Sends up to 10 Web Push requests at a time with high urgency, signed with `VAPID_KEYS_JSON`.
- **Failure Classification**: Push responses `404` and `410` mark the delivery `FINAL_FAILED` and deactivate the subscription. Network errors, `429`, and `5xx` mark it `RETRYABLE_FAILED`. Any other failure marks it `FINAL_FAILED`.
- **Retry Window**: A `RETRYABLE_FAILED` delivery is retried only while its release aired less than 5 minutes ago; after that it becomes `FINAL_FAILED`.

### Data Retention

- **Daily Cleanup**: The `cleanup-notification-data` cron job removes expired devices, deliveries, releases, batches, usage counters, and rate-limit windows. See [Data Retention](#data-retention-1) for the limits.

## Configuration Map

The notification pipeline crosses three configuration surfaces:

| Surface       | Name                             | Must match                                     |
| ------------- | -------------------------------- | ---------------------------------------------- |
| Vercel        | `NOTIFICATION_CRON_SECRET`       | Vault `notification_cron_secret`               |
| Edge Function | `NOTIFICATION_EDGE_SECRET`       | Vault `notification_edge_secret`               |
| Vercel        | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`   | Public half of Edge Function `VAPID_KEYS_JSON` |
| Vault         | `notification_application_url`   | Stable Vercel production origin                |
| Vault         | `notification_edge_function_url` | Deployed `send-notification-batch` URL         |

Never commit or expose a service-role key, private VAPID key, cron secret, or Edge Function secret.

## Local Edge Function Environment

Copy the Supabase environment template to an ignored local file:

```powershell
Copy-Item supabase/.env.example supabase/.env.local
```

Replace every example value in `supabase/.env.local`. The Edge Function reads:

| Variable                    | Purpose                                                                     |
| --------------------------- | --------------------------------------------------------------------------- |
| `SUPABASE_URL`              | Project URL used by the Edge Function                                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Administrative key used by the Edge Function repository                     |
| `NOTIFICATION_EDGE_SECRET`  | Authorizes calls from PostgreSQL to the Edge Function                       |
| `VAPID_KEYS_JSON`           | Complete private/public JWK pair used to sign Web Push requests             |
| `VAPID_SUBJECT`             | `mailto:` or `https://` contact identifier for the VAPID application server |

Start the local Supabase stack from the repository root with `npm run supabase:start`, then serve the function with the file passed explicitly:

```bash
npx supabase functions serve send-notification-batch --env-file supabase/.env.local --no-verify-jwt
```

## Create Secrets

Create two independent 64-character hexadecimal secrets with PowerShell. Run the command once for the cron secret and again for the Edge Function secret:

```powershell
$secret=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant(); Set-Clipboard $secret; $secret
```

Generate the VAPID key pair from the repository root:

```bash
node scripts/generate-vapid-keys.mjs
```

Keep the files from one execution together:

- The complete contents of `vapid-output/vapid-public-key.txt` go to Vercel as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- The complete contents of `vapid-output/vapid-keys.json` go to the Edge Function as `VAPID_KEYS_JSON`.

## Configure Supabase Edge Function Secrets

Hosted Supabase Edge Functions provide `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` automatically. In **Supabase Dashboard → Edge Functions → Secrets**, add these custom secrets:

| Name                       | Example format                                        |
| -------------------------- | ----------------------------------------------------- |
| `NOTIFICATION_EDGE_SECRET` | 64-character hexadecimal secret                       |
| `VAPID_KEYS_JSON`          | Complete JSON string printed by the generation script |
| `VAPID_SUBJECT`            | `mailto:admin@example.com`                            |

Deploy the function after setting the secrets:

```bash
npx supabase functions deploy send-notification-batch --no-verify-jwt
```

The function validates its own bearer token against `NOTIFICATION_EDGE_SECRET`. `verify_jwt = false` in `config.toml` is therefore intentional.

## Configure Supabase Vault

Open **Supabase Dashboard → Project Settings → Integrations → Vault → Secrets** and create or update these four secrets:

| Vault name                       | Value                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `notification_application_url`   | Stable Vercel production origin, for example `https://anime-calendar.example.com` |
| `notification_cron_secret`       | Exact value of Vercel `NOTIFICATION_CRON_SECRET`                                  |
| `notification_edge_function_url` | `https://your-project-ref.supabase.co/functions/v1/send-notification-batch`       |
| `notification_edge_secret`       | Exact value of Edge Function `NOTIFICATION_EDGE_SECRET`                           |

Use only the origin for `notification_application_url`; do not append `/api/notification-jobs/sync-schedule`. The database function removes trailing slashes and appends that path itself.

Use the stable production domain rather than a deployment-specific Vercel URL. A deleted deployment URL causes `404 DEPLOYMENT_NOT_FOUND`.

When a Vault name has several secrets, the database reads the most recently created one. A missing secret raises `Notification Vault secret not found`.

## Apply Database Migrations

Link the CLI to the intended Supabase project, review the target, and apply the migrations:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

The migrations in `migrations/` create the notification tables, database functions, and these cron jobs:

| Cron job                       | Schedule (UTC) | Runs                                   |
| ------------------------------ | -------------- | -------------------------------------- |
| `sync-notification-schedule`   | `*/15 * * * *` | `InvokeScheduleSync()`                 |
| `dispatch-anime-notifications` | `* * * * *`    | `CreateAndInvokeNotificationBatches()` |
| `cleanup-notification-data`    | `30 18 * * *`  | `CleanupNotificationData()`            |

## Data Retention

`cleanup-notification-data` runs `CleanupNotificationData()` at 18:30 UTC (01:30 Asia/Bangkok) and permanently deletes rows past these limits:

| Table                      | Deleted when                                                            |
| -------------------------- | ----------------------------------------------------------------------- |
| `notification_devices`     | `last_seen_at` is older than 90 days                                    |
| `notification_deliveries`  | Its release's `airing_at` is older than 30 days                         |
| `anime_releases`           | `airing_at` is older than 30 days                                       |
| `notification_batches`     | `created_at` is older than 30 days and no delivery references the batch |
| `notification_usage_daily` | `usage_date` is more than 90 days before the current date               |
| `api_rate_limits`          | `window_started_at` is older than 1 day                                 |

The function returns the deleted row count for each table when called directly with `select public."CleanupNotificationData"();`. pg_cron records only the command status, such as `1 row`, so scheduled runs do not show those counts. Inspect recent scheduled runs with:

```sql
select
  run.status,
  run.return_message,
  run.start_time
from cron.job_run_details run
join cron.job job on job.jobid = run.jobid
where job.jobname = 'cleanup-notification-data'
order by run.start_time desc
limit 10;
```

## Verify the Pipeline

### 1. Verify cron registration

```sql
select
  jobid,
  jobname,
  schedule,
  active
from cron.job
where jobname in (
  'sync-notification-schedule',
  'dispatch-anime-notifications',
  'cleanup-notification-data'
)
order by jobname;
```

All three rows must exist and have `active = true`.

### 2. Verify cron execution

```sql
select
  job.jobname,
  run.status,
  run.return_message,
  run.start_time,
  run.end_time
from cron.job_run_details run
join cron.job job on job.jobid = run.jobid
where job.jobname in (
  'sync-notification-schedule',
  'dispatch-anime-notifications'
)
order by run.start_time desc
limit 50;
```

A `succeeded` cron row confirms that PostgreSQL queued the HTTP request. It does not confirm that the destination accepted the request.

### 3. Verify HTTP responses

```sql
select
  id,
  status_code,
  timed_out,
  error_msg,
  content,
  created
from net._http_response
order by created desc
limit 30;
```

Expected schedule-sync and Edge Function responses have `status_code = 200`. Common failures are:

- `401 UNAUTHORIZED`: the Vercel and Vault cron secrets, or the Edge Function and Vault edge secrets, do not match.
- `404 DEPLOYMENT_NOT_FOUND`: `notification_application_url` points to a removed Vercel deployment.
- `400 INVALID_REQUEST`: the Edge Function received a body without exactly one UUID `batch_id`.
- `404 NOT_FOUND` or `409 NOT_CLAIMABLE`: the Edge Function could not find or claim the batch.
- `500` or `503`: inspect the Vercel function logs for the schedule-sync route, or the Edge Function logs for `NOTIFICATION_BATCH_FAILED`.

Trigger an immediate schedule sync and then inspect the newest response:

```sql
select public."InvokeScheduleSync"() as request_id;
```

Wait several seconds, then run:

```sql
select
  id,
  status_code,
  timed_out,
  error_msg,
  content,
  created
from net._http_response
order by created desc
limit 1;
```

### 4. Verify synchronized releases

```sql
select
  count(*) as release_count,
  min(airing_at) as earliest_airing_at,
  max(airing_at) as latest_airing_at,
  max(synced_at) as last_synced_at
from public.anime_releases;
```

`release_count` must be greater than zero before the dispatcher can create deliveries.

### 5. Verify notification delivery

```sql
select
  delivery.status,
  delivery.attempt_count,
  delivery.error_code,
  delivery.last_attempt_at,
  delivery.sent_at,
  release.title,
  release.airing_at at time zone 'Asia/Bangkok' as airing_at_bangkok
from public.notification_deliveries delivery
join public.anime_releases release
  on release.anilist_schedule_id = delivery.anilist_schedule_id
order by coalesce(delivery.last_attempt_at, release.airing_at) desc
limit 20;
```

`SENT` confirms that the backend completed the Web Push request. `RETRYABLE_FAILED` and `FINAL_FAILED` include an `error_code`, such as `PUSH_410`, `PUSH_NETWORK`, or `SUBSCRIPTION_MISSING`, for diagnosis.

## Deployment Checklist

- Vercel production variables are configured and the project has been redeployed.
- Vercel `NOTIFICATION_CRON_SECRET` matches Vault `notification_cron_secret`.
- Edge Function `NOTIFICATION_EDGE_SECRET` matches Vault `notification_edge_secret`.
- The VAPID public key and JSON key pair came from the same generation command.
- `notification_application_url` opens the current production deployment.
- `notification_edge_function_url` points to the deployed function.
- Cron jobs are active, HTTP responses are `200`, and `anime_releases` contains rows.

import 'server-only';

import type { NextRequest } from 'next/server';

import { ReadServerEnvironment } from './environment';
import { ReadSupabaseAdminClient } from './supabase-admin';

export type RateLimitClass = 'READ' | 'MUTATION';

interface RateLimitPolicy {
  readonly device_request_limit: number;
  readonly ip_request_limit: number;
  readonly window_seconds: number;
}

interface RateLimitKeyInput {
  readonly rate_limit_class: RateLimitClass;
  readonly device_id: string | null;
  readonly client_ip: string;
  readonly rate_limit_secret: string;
}

interface RateLimitKeys {
  readonly device_rate_limit_key: string | null;
  readonly ip_rate_limit_key: string;
}

type ConsumeRateLimit = (
  rate_limit_key: string,
  request_limit: number,
  window_seconds: number
) => Promise<boolean>;

const RATE_LIMIT_POLICIES: Readonly<Record<RateLimitClass, RateLimitPolicy>> =
  Object.freeze({
    READ: Object.freeze({
      device_request_limit: 120,
      ip_request_limit: 600,
      window_seconds: 60
    }),
    MUTATION: Object.freeze({
      device_request_limit: 60,
      ip_request_limit: 300,
      window_seconds: 60
    })
  });

export class RateLimitServiceError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'RateLimitServiceError';
  }
}

export function ReadRateLimitPolicy(
  rate_limit_class: RateLimitClass
): RateLimitPolicy {
  return RATE_LIMIT_POLICIES[rate_limit_class];
}

async function CreateHmacHex(value: string, secret: string): Promise<string> {
  const hmac_key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    hmac_key,
    new TextEncoder().encode(value)
  );

  return Buffer.from(signature).toString('hex');
}

export async function CreateRateLimitKeys(
  input: RateLimitKeyInput
): Promise<RateLimitKeys> {
  const ip_hash = await CreateHmacHex(
    `${input.rate_limit_class}:${input.client_ip}`,
    input.rate_limit_secret
  );

  return Object.freeze({
    device_rate_limit_key:
      input.device_id === null
        ? null
        : `${input.rate_limit_class}:DEVICE:${input.device_id}`,
    ip_rate_limit_key: `${input.rate_limit_class}:IP:${ip_hash}`
  });
}

async function ConsumeDatabaseRateLimit(
  rate_limit_key: string,
  request_limit: number,
  window_seconds: number
): Promise<boolean> {
  const { data, error } = await ReadSupabaseAdminClient().rpc(
    'ConsumeApiRateLimit',
    {
      rate_limit_key_input: rate_limit_key,
      request_limit_input: request_limit,
      window_seconds_input: window_seconds
    }
  );

  if (error !== null || typeof data !== 'boolean') {
    throw new RateLimitServiceError('Unable to consume API rate limit');
  }

  return data;
}

export async function EnforceNotificationRateLimit(
  input: RateLimitKeyInput,
  ConsumeRateLimit: ConsumeRateLimit = ConsumeDatabaseRateLimit
): Promise<boolean> {
  const rate_limit_policy = ReadRateLimitPolicy(input.rate_limit_class);
  const rate_limit_keys = await CreateRateLimitKeys(input);

  if (
    rate_limit_keys.device_rate_limit_key !== null &&
    !(await ConsumeRateLimit(
      rate_limit_keys.device_rate_limit_key,
      rate_limit_policy.device_request_limit,
      rate_limit_policy.window_seconds
    ))
  ) {
    return false;
  }

  return await ConsumeRateLimit(
    rate_limit_keys.ip_rate_limit_key,
    rate_limit_policy.ip_request_limit,
    rate_limit_policy.window_seconds
  );
}

export function ReadClientIp(request: NextRequest): string {
  const forwarded_ip = request.headers
    .get('x-forwarded-for')
    ?.split(',', 1)[0]
    .trim();

  return (forwarded_ip || request.headers.get('x-real-ip') || 'unknown').slice(
    0,
    64
  );
}

export function EnforceRequestRateLimit(
  request: NextRequest,
  rate_limit_class: RateLimitClass,
  device_id: string | null
): Promise<boolean> {
  return EnforceNotificationRateLimit({
    rate_limit_class,
    device_id,
    client_ip: ReadClientIp(request),
    rate_limit_secret: ReadServerEnvironment().NOTIFICATION_CRON_SECRET
  });
}

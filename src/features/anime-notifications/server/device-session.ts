import 'server-only';

import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { IsTrustedOrigin } from './request-security';
import { ReadSupabaseAdminClient } from './supabase-admin';

import type { AuthenticatedDevice } from '../types/api';

const DEVICE_TOKEN_BYTE_LENGTH = 32;
const DEVICE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SESSION_TOKEN_HASH_PATTERN = /^[a-f0-9]{64}$/;
const DEVICE_RETENTION_MILLISECONDS = 90 * 24 * 60 * 60 * 1_000;

const DeviceRowSchema = z.strictObject({
  id: z.uuid(),
  session_token_hash: z.string().regex(SESSION_TOKEN_HASH_PATTERN)
});

export const DEVICE_COOKIE_NAME = 'anime-calendar-device';
export const DEVICE_COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: DEVICE_RETENTION_MILLISECONDS / 1_000,
  path: '/'
});

export interface CreatedDeviceSession {
  readonly device_id: string;
  readonly device_token: string;
}

export class DeviceSessionError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'DeviceSessionError';
  }
}

export function CreateDeviceToken(): string {
  const token_bytes = crypto.getRandomValues(
    new Uint8Array(DEVICE_TOKEN_BYTE_LENGTH)
  );

  return Buffer.from(token_bytes).toString('base64url');
}

export async function HashDeviceToken(device_token: string): Promise<string> {
  const token_digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(device_token)
  );

  return Buffer.from(token_digest).toString('hex');
}

async function AuthenticateDeviceToken(
  device_token: string | null
): Promise<AuthenticatedDevice | null> {
  if (device_token === null || !DEVICE_TOKEN_PATTERN.test(device_token)) {
    return null;
  }

  const session_token_hash = await HashDeviceToken(device_token);
  const active_after = new Date(
    Date.now() - DEVICE_RETENTION_MILLISECONDS
  ).toISOString();
  const supabase_admin_client = ReadSupabaseAdminClient();
  const { data: unparsed_device, error: read_error } =
    await supabase_admin_client
      .from('notification_devices')
      .select('id, session_token_hash')
      .eq('session_token_hash', session_token_hash)
      .gte('last_seen_at', active_after)
      .maybeSingle();

  if (read_error !== null) {
    throw new DeviceSessionError('Unable to authenticate device session');
  }

  if (unparsed_device === null) {
    return null;
  }

  const parsed_device = DeviceRowSchema.safeParse(unparsed_device);

  if (!parsed_device.success) {
    throw new DeviceSessionError('Device session record is invalid');
  }

  const current_timestamp = new Date().toISOString();
  const { error: update_error } = await supabase_admin_client
    .from('notification_devices')
    .update({
      last_seen_at: current_timestamp,
      updated_at: current_timestamp
    })
    .eq('id', parsed_device.data.id);

  if (update_error !== null) {
    throw new DeviceSessionError('Unable to refresh device session');
  }

  return Object.freeze({
    device_id: parsed_device.data.id,
    session_token_hash: parsed_device.data.session_token_hash
  });
}

export function AuthenticateDevice(
  request: NextRequest
): Promise<AuthenticatedDevice | null> {
  const device_token = request.cookies.get(DEVICE_COOKIE_NAME)?.value ?? null;

  return AuthenticateDeviceToken(device_token);
}

export async function CreateDeviceSession(): Promise<CreatedDeviceSession> {
  const device_token = CreateDeviceToken();
  const session_token_hash = await HashDeviceToken(device_token);
  const { data: unparsed_device, error } = await ReadSupabaseAdminClient()
    .from('notification_devices')
    .insert({ session_token_hash })
    .select('id, session_token_hash')
    .single();

  if (error !== null) {
    throw new DeviceSessionError('Unable to create device session');
  }

  const parsed_device = DeviceRowSchema.safeParse(unparsed_device);

  if (!parsed_device.success) {
    throw new DeviceSessionError('Created device session record is invalid');
  }

  return Object.freeze({
    device_id: parsed_device.data.id,
    device_token
  });
}

export { IsTrustedOrigin };

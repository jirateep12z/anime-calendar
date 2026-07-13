import { NotificationClientError } from '../api/notification-api-client';

const URL_SAFE_BASE64_PATTERN = /^[A-Za-z0-9_-]+$/;
const UNCOMPRESSED_P256_KEY_BYTE_LENGTH = 65;
const UNCOMPRESSED_P256_PREFIX = 4;

export function DecodeVapidPublicKey(
  public_key: string
): Uint8Array<ArrayBuffer> {
  const normalized_key = public_key.trim();

  if (!URL_SAFE_BASE64_PATTERN.test(normalized_key)) {
    throw new NotificationClientError(
      'PUSH_SUBSCRIPTION_FAILED',
      'Public Push key ไม่ถูกต้อง'
    );
  }

  const padding = '='.repeat((4 - (normalized_key.length % 4)) % 4);
  const base64_value = (normalized_key + padding)
    .replaceAll('-', '+')
    .replaceAll('_', '/');
  let binary_value: string;

  try {
    binary_value = window.atob(base64_value);
  } catch (error) {
    throw new NotificationClientError(
      'PUSH_SUBSCRIPTION_FAILED',
      'Public Push key ไม่ถูกต้อง',
      null,
      error
    );
  }

  const decoded_key = new Uint8Array(new ArrayBuffer(binary_value.length));

  for (let byte_index = 0; byte_index < binary_value.length; byte_index += 1) {
    decoded_key[byte_index] = binary_value.charCodeAt(byte_index);
  }

  if (
    decoded_key.byteLength !== UNCOMPRESSED_P256_KEY_BYTE_LENGTH ||
    decoded_key[0] !== UNCOMPRESSED_P256_PREFIX
  ) {
    throw new NotificationClientError(
      'PUSH_SUBSCRIPTION_FAILED',
      'Public Push key ไม่ใช่ P-256 key'
    );
  }

  return decoded_key;
}

export function ReadPublicVapidKey(): string {
  const public_key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

  if (!public_key) {
    throw new NotificationClientError(
      'PUSH_SUBSCRIPTION_FAILED',
      'ระบบยังไม่ได้ตั้งค่า Public Push key'
    );
  }

  return public_key;
}

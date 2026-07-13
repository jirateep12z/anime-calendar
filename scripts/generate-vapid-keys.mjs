import { mkdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const OUTPUT_DIRECTORY = 'vapid-output';
const VAPID_KEYS_FILE = 'vapid-keys.json';
const VAPID_PUBLIC_KEY_FILE = 'vapid-public-key.txt';

async function GenerateVapidKeys() {
  const key_pair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  const public_key = await crypto.subtle.exportKey('jwk', key_pair.publicKey);
  const private_key = await crypto.subtle.exportKey('jwk', key_pair.privateKey);
  const public_key_raw = new Uint8Array(
    await crypto.subtle.exportKey('raw', key_pair.publicKey)
  );

  return Object.freeze({
    vapid_keys: Object.freeze({
      publicKey: public_key,
      privateKey: private_key
    }),
    vapid_public_key: Buffer.from(public_key_raw).toString('base64url')
  });
}

async function WriteVapidFiles(vapid_keys, vapid_public_key) {
  const output_directory_path = join(process.cwd(), OUTPUT_DIRECTORY);
  const vapid_keys_path = join(output_directory_path, VAPID_KEYS_FILE);
  const vapid_public_key_path = join(
    output_directory_path,
    VAPID_PUBLIC_KEY_FILE
  );

  await mkdir(output_directory_path, { recursive: true });
  await Promise.all([
    writeFile(vapid_keys_path, `${JSON.stringify(vapid_keys, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'w'
    }),
    writeFile(vapid_public_key_path, `${vapid_public_key}\n`, {
      encoding: 'utf8',
      flag: 'w'
    })
  ]);

  return Object.freeze({
    vapid_keys_path: relative(process.cwd(), vapid_keys_path),
    vapid_public_key_path: relative(process.cwd(), vapid_public_key_path)
  });
}

const generated_vapid_keys = await GenerateVapidKeys();
const generated_file_paths = await WriteVapidFiles(
  generated_vapid_keys.vapid_keys,
  generated_vapid_keys.vapid_public_key
);

console.log(
  JSON.stringify(
    {
      next_public_vapid_public_key: generated_vapid_keys.vapid_public_key,
      ...generated_file_paths
    },
    null,
    2
  )
);

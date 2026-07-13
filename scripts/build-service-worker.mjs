import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const script_directory = path.dirname(fileURLToPath(import.meta.url));
const project_directory = path.resolve(script_directory, '..');
const service_worker_version =
  process.env.VERCEL_GIT_COMMIT_SHA ?? crypto.randomUUID();

await build({
  absWorkingDir: project_directory,
  entryPoints: [
    path.join(project_directory, 'src', 'service-worker', 'service-worker.ts')
  ],
  bundle: true,
  outfile: path.join(project_directory, 'public', 'sw.js'),
  format: 'iife',
  target: 'es2022',
  define: {
    'process.env.SERVICE_WORKER_VERSION': JSON.stringify(
      service_worker_version
    )
  }
});

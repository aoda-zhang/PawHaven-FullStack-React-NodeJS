import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const pnpmDir = join(process.cwd(), '..', '..', 'node_modules', '.pnpm');
const cliDir = readdirSync(pnpmDir).find((d) =>
  d.startsWith('@tailwindcss+cli@'),
);

if (!cliDir) {
  throw new Error('@tailwindcss/cli not found in node_modules/.pnpm');
}

const entry = join(
  pnpmDir,
  cliDir,
  'node_modules',
  '@tailwindcss',
  'cli',
  'dist',
  'index.mjs',
);

execFileSync(
  process.execPath,
  [entry, '-i', './scripts/build-tokens.css', '-o', './dist/design-tokens.css'],
  { stdio: 'inherit' },
);

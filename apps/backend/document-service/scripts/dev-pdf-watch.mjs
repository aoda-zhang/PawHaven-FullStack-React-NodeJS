import { spawn, execFileSync } from 'node:child_process';
import { watch, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const docServiceRoot = join(here, '..');
const repoRoot = join(docServiceRoot, '..', '..', '..');

const prebuildScript = join(here, 'prebuild-pdf-style.mjs');
const nestBin = join(docServiceRoot, 'node_modules', '.bin', 'nest');

// Every source that influences the generated PDF stylesheet must be watched.
// Tailwind's entry (engine/index.css) @source-scans components/** and templates/**,
// and @imports the design-system tokens/theme that prebuild first syncs from the
// design-system package. Editing any of these must trigger a prebuild.
const FILE_INPUTS = [
  join(docServiceRoot, 'src', 'modules', 'pdf', 'engine', 'index.css'),
  join(repoRoot, 'packages', 'design-system', 'src', 'theme.css'),
];
const DIR_INPUTS = [
  join(docServiceRoot, 'src', 'modules', 'pdf', 'components'),
  join(docServiceRoot, 'src', 'modules', 'pdf', 'templates'),
  join(repoRoot, 'packages', 'design-system', 'src', 'tokens'),
];

const ignored = (name) =>
  name.startsWith('.') || name === 'node_modules' || name === 'pdfRunTime';

function collectDirs(root, acc = []) {
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return acc;
  }
  acc.push(root);
  for (const e of entries) {
    if (ignored(e.name)) continue;
    if (e.isDirectory()) collectDirs(join(root, e.name), acc);
  }
  return acc;
}

function signatureOf() {
  const hash = createHash('sha1');
  const digestFile = (file) => {
    try {
      hash.update(file);
      hash.update(readFileSync(file));
    } catch {}
  };
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (ignored(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else digestFile(full);
    }
  };
  for (const dir of DIR_INPUTS) walk(dir);
  for (const file of FILE_INPUTS) digestFile(file);
  return hash.digest('hex');
}

let lastSignature = null;
const inputsUnchanged = () => {
  const next = signatureOf();
  if (next === lastSignature) return true;
  lastSignature = next;
  return false;
};

let prebuildInFlight = false;
let debounceTimer = null;
const DEBOUNCE_MS = 150;

const runPrebuild = () => {
  if (prebuildInFlight || inputsUnchanged()) return;
  prebuildInFlight = true;
  try {
    execFileSync(process.execPath, [prebuildScript], { stdio: 'inherit' });
  } finally {
    prebuildInFlight = false;
  }
};

const schedulePrebuild = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runPrebuild, DEBOUNCE_MS);
};

console.log('› Running prebuild once at startup...');
runPrebuild();

const nestChild = spawn(nestBin, ['start', '--watch'], {
  cwd: docServiceRoot,
  stdio: 'inherit',
  detached: true,
});

const watchers = [];
for (const dir of DIR_INPUTS) {
  for (const d of collectDirs(dir)) {
    try {
      watchers.push(watch(d, () => schedulePrebuild()));
    } catch {}
  }
}
for (const file of FILE_INPUTS) {
  const parent = dirname(file);
  const name = basename(file);
  try {
    watchers.push(
      watch(parent, (_event, filename) => {
        if (!filename || filename === name) schedulePrebuild();
      }),
    );
  } catch {}
}

const stop = (signal) => {
  watchers.forEach((watcher) => watcher.close());
  if (debounceTimer) clearTimeout(debounceTimer);
  if (nestChild.exitCode === null && nestChild.signalCode === null) {
    try {
      process.kill(-nestChild.pid, signal);
    } catch {}
  }
};

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

console.log(
  '› Watching PDF components/templates and design-system sources. Press Ctrl-C to stop.',
);

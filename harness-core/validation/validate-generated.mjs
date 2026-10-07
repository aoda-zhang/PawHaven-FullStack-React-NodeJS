#!/usr/bin/env node
// Proves the generated runtime output is current.
//
//   node harness-core/validation/validate-generated.mjs
//
// Drift is the only harness failure that looks like a pass: the canonical source is right, the output
// is stale, and nothing breaks until a runtime reads the stale copy. This check rebuilds every
// artifact in memory from the canonical source and compares it to what is on disk. It needs no
// runtime, so it runs before any loader check and it is the one that catches a source change nobody
// regenerated.
//
// It deliberately imports the adapter's pure build function rather than shelling out to the
// generator: comparing in memory cannot leave the working tree half-written by a check that was only
// supposed to read.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { diffGenerated } from '../adapters/pi/generate.mjs';

const harnessCore = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(harnessCore, '..');

const drift = diffGenerated();

if (drift.length > 0) {
  console.error('generated output does not match the canonical source.');
  for (const d of drift) console.error(`  ${d}`);
  console.error(
    '\nvalidate-generated: the canonical source changed and the runtime output was not regenerated.\n' +
      'Run `pnpm harness:generate`. Never hand-edit generated output: the next run discards the edit.',
  );
  process.exit(1);
}

console.log(
  'generated output OK — every runtime artifact matches harness-core/, nothing stale',
);
void repoRoot;

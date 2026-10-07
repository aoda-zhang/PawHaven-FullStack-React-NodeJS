#!/usr/bin/env node
// Writes `.pi/settings.json`'s `subagents.agentOverrides` from `.pi/config/models.yaml`.
//
// The registry is the source of truth and settings.json is the rendered artifact: pi reads
// `thinking` per lane from settings.json, and the tier a lane belongs to is recorded once,
// in the registry. Run this after editing either file, then `pnpm pi-check`, which fails on
// the drift this script resolves.
//
//   node scripts/sync-model-tiers.mjs           # write
//   node scripts/sync-model-tiers.mjs --check   # exit 1 on drift, write nothing
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveTiers } from './lib/model-registry.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const settingsPath = join(repoRoot, '.pi', 'settings.json');
const check = process.argv.includes('--check');

const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
const { lanes } = resolveTiers(repoRoot);

const agentOverrides = {};
for (const [lane, resolved] of Object.entries(lanes)) {
  const override = { thinking: resolved.thinking };
  if (resolved.model !== 'inherit') override.model = resolved.model;
  agentOverrides[lane] = override;
}

const current = settings.subagents?.agentOverrides ?? {};
if (check) {
  const same = JSON.stringify(current) === JSON.stringify(agentOverrides);
  if (!same) {
    console.error(
      'model registry drift: .pi/settings.json subagents.agentOverrides does not match .pi/config/models.yaml. Run `node scripts/sync-model-tiers.mjs`.',
    );
    process.exit(1);
  }
  console.log('model tiers: settings.json matches .pi/config/models.yaml');
  process.exit(0);
}

settings.subagents = { ...settings.subagents, agentOverrides };
writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
console.log(
  `model tiers: wrote ${Object.keys(agentOverrides).length} lanes to .pi/settings.json`,
);

#!/usr/bin/env node
// Runtime integrity for the Pi adapter — everything Pi does NOT have to teach us.
//
//   node harness-core/validation/validate-runtime.mjs
//
// This check proves the `.pi/` runtime is a correct thin adapter of `harness-core/`, without loading
// Pi itself. It answers four questions the canonical check (validate-core) cannot, and the Pi loader
// check (adapters/pi/validate.mjs) answers separately:
//
//   1. Reference integrity — every path in `.pi/settings.json` resolves to a real canonical resource.
//      Skills and prompts are referenced directly from harness-core; they are never copied.
//   2. Forbidden projection — `.pi/skills`, `.pi/prompts`, and `.pi/rules` must NOT exist. A copy of
//      canonical content under `.pi/` is a second source of truth and the drift the harness forbids.
//      `.pi/agents` is the one allowed projection (Pi discovers agents only from there).
//   3. Agent bridge integrity — every `.pi/agents/<plugin>__<name>.md` is byte-identical to its
//      canonical source, and `settings.subagents.agentOverrides` matches the tiers resolved from
//      canonical `modelTier` frontmatter.
//   4. Extension bridge integrity — the harness rules are wired in through the Pi extension, not copied
//      as prompt files.
//
// It must stay import-free of anything Pi-specific: if it ever needs a runtime's loader, that belongs
// in adapters/pi/validate.mjs.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAgents, resolveAgentTiers } from '../config/model-policy.mjs';
import { renderAgent } from '../adapters/pi/sync-agents.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dotPi = join(repoRoot, '.pi');

const failures = [];
const warnings = [];
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);

// --- settings.json exists ---------------------------------------------------------------------

const settingsPath = join(dotPi, 'settings.json');
if (!existsSync(settingsPath)) {
  console.error(
    'harness:runtime: .pi/settings.json is missing — run `pnpm pi:sync`.',
  );
  process.exit(1);
}
const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));

// --- forbidden materialized trees --------------------------------------------------------------

for (const dir of ['skills', 'prompts', 'rules']) {
  const path = join(dotPi, dir);
  if (existsSync(path)) {
    fail(
      `.pi/${dir}/ exists — canonical content must be referenced directly, never copied. ` +
        `Remove it; the runtime reads from harness-core.`,
    );
  }
}

// --- reference integrity: settings paths resolve ------------------------------------------------

function assertPathList(key, kind) {
  for (const entry of settings[key] ?? []) {
    const target = resolve(repoRoot, entry);
    if (!existsSync(target)) {
      fail(
        `${key}: \`${entry}\` does not resolve to a path under the repository.`,
      );
      continue;
    }
    if (!statSync(target).isDirectory()) {
      fail(
        `${key}: \`${entry}\` is not a directory — skills/prompts load recursively from a dir.`,
      );
    }
    if (!relative(join(repoRoot, 'harness-core'), target).startsWith('..')) {
      // path lives inside harness-core — good. Anything else is a projection, not a reference.
      continue;
    }
    if (key === 'skills' || key === 'prompts') {
      warn(
        `${key}: \`${entry}\` points outside harness-core. Skills/prompts should reference harness-core directly.`,
      );
    }
  }
}
assertPathList('skills', 'skill');
assertPathList('prompts', 'prompt');

// extensions must exist and include the harness rules bridge.
for (const entry of settings.extensions ?? []) {
  const target = resolve(repoRoot, entry);
  if (!existsSync(target)) {
    fail(
      `extensions: \`${entry}\` does not resolve to a file under the repository.`,
    );
  }
}
const bridge = join(dotPi, 'extensions', 'harness.ts');
if (!existsSync(bridge)) {
  fail(
    'extensions: the harness rules bridge (.pi/extensions/harness.ts) is missing — rules would not be injected.',
  );
} else if (
  !(settings.extensions ?? []).some((e) => resolve(repoRoot, e) === bridge)
) {
  fail(
    'extensions: .pi/settings.json does not load .pi/extensions/harness.ts.',
  );
}

// packages must be installed (Pi-managed npm tree).
for (const source of settings.packages ?? []) {
  const match = /^npm:(.+)$/.exec(source);
  if (!match) continue;
  const pkgName = match[1].replace(/@[^/@]+$/, '');
  const pkgRoot = join(dotPi, 'npm', 'node_modules', pkgName);
  if (!existsSync(pkgRoot)) {
    fail(
      `${source}: not installed — run \`pi install\` (or \`pnpm pi:sync\`).`,
    );
  }
}

// --- agent bridge integrity --------------------------------------------------------------------

const canonicalAgents = discoverAgents(repoRoot);
if (canonicalAgents.length === 0) {
  fail(
    'agent bridge: no canonical agents discovered under harness-core/plugins/*/agents/.',
  );
}

const agentsDir = join(dotPi, 'agents');
const projected = new Map();
if (existsSync(agentsDir)) {
  for (const file of readdirSync(agentsDir)) {
    if (!file.endsWith('.md')) continue;
    const full = join(agentsDir, file);
    if (!statSync(full).isFile()) continue;
    const expectedPlugin = file.slice(0, file.indexOf('__'));
    const expectedName = file.slice(file.indexOf('__') + 2, -3);
    projected.set(expectedName, { file, plugin: expectedPlugin, full });
  }
}

const allNames = canonicalAgents.map((a) => a.name);
const seen = new Set();
for (const agent of canonicalAgents) {
  const proj = projected.get(agent.name);
  if (!proj) {
    fail(
      `agent bridge: canonical agent \`${agent.name}\` (${agent.plugin}) has no projection in .pi/agents.`,
    );
    continue;
  }
  if (proj.plugin !== agent.plugin) {
    fail(
      `agent bridge: \`${agent.name}\` projected as ${proj.plugin}__ but canonical plugin is ${agent.plugin}.`,
    );
  }
  // The projection renders Pi frontmatter from the canonical source and copies the body verbatim. Re-render
  // here and compare, so a hand-edit or a stale projection is caught against the canonical source, not a copy.
  const canonical = readFileSync(agent.filePath, 'utf8');
  const end = canonical.indexOf('\n---', 3);
  const body = end === -1 ? '' : canonical.slice(end + 4);
  const expected = `${renderAgent(canonical, allNames)}\n${body}`;
  const onDisk = readFileSync(proj.full, 'utf8');
  if (expected !== onDisk) {
    fail(
      `agent bridge: .pi/agents/${proj.file} is not the current render of its canonical source. Re-run \`pnpm pi:sync\`.`,
    );
  }
  seen.add(agent.name);
}
for (const name of projected.keys()) {
  if (!seen.has(name)) {
    fail(
      `agent bridge: \`${name}\` is projected in .pi/agents but has no canonical source. Remove the stray file.`,
    );
  }
}

// overrides in settings must match resolved tiers exactly.
const { agents: tierOf } = resolveAgentTiers(repoRoot);
const overrides = settings.subagents?.agentOverrides ?? {};
for (const agent of canonicalAgents) {
  const ov = overrides[agent.name];
  if (!ov) {
    fail(
      `agent bridge: \`${agent.name}\` has no rendered thinking override in settings.subagents.agentOverrides.`,
    );
    continue;
  }
  const expected = tierOf[agent.name]?.thinking;
  if (ov.thinking !== expected) {
    fail(
      `agent bridge: \`${agent.name}\` override thinking=\`${ov.thinking}\` but canonical tier resolves to \`${expected}\`. Re-run \`pnpm pi:sync\`.`,
    );
  }
}
for (const name of Object.keys(overrides)) {
  if (!canonicalAgents.some((a) => a.name === name)) {
    fail(
      `agent bridge: rendered override for \`${name}\`, which no canonical agent answers to.`,
    );
  }
}

// --- report ------------------------------------------------------------------------------------

console.log(
  `reference: ${settings.skills?.length ?? 0} skill dir(s), ${settings.prompts?.length ?? 0} prompt dir(s)`,
);
console.log(
  `agents:    ${canonicalAgents.length} canonical, ${projected.size} projected`,
);
console.log(`overrides: ${Object.keys(overrides).length} rendered tier(s)`);

for (const w of warnings) console.log(`  WARN ${w}`);
for (const f of failures) console.error(`  FAIL ${f}`);

if (failures.length > 0) {
  console.error(`harness:runtime: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log(
  'harness runtime OK — .pi/ is a faithful thin adapter of harness-core/',
);

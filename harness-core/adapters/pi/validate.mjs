#!/usr/bin/env node
// Validates the Pi runtime's generated output using Pi's OWN loaders, so this check fails for the
// same reasons Pi would fail at startup.
//
//   node harness-core/adapters/pi/validate.mjs
//
// Everything Pi-specific is allowed here and nowhere else: frontmatter field names, the settings
// schema, the prompt loader's discovery rules, the skill loader's recursion rules, the subagent
// package manifest, and the subagent file layout. None of it may leak back into harness-core
// capabilities, workflows, or rules — the canonical validator is what proves that, and it must not
// import anything from this directory.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const adapterDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(adapterDir, '..', '..', '..');

let loadSkills;
let loadPromptTemplates;
try {
  ({ loadSkills } =
    await import('@earendil-works/pi-coding-agent/dist/core/skills.js'));
  ({ loadPromptTemplates } =
    await import('@earendil-works/pi-coding-agent/dist/core/prompt-templates.js'));
} catch {
  const distRoot = await resolvePiDist();
  if (!distRoot) {
    console.error(
      'pi:check: could not locate @earendil-works/pi-coding-agent. Install pi ' +
        '(npm i -g @earendil-works/pi-coding-agent) or add it as a devDependency.',
    );
    process.exit(2);
  }
  ({ loadSkills } = await import(join(distRoot, 'core', 'skills.js')));
  ({ loadPromptTemplates } = await import(
    join(distRoot, 'core', 'prompt-templates.js')
  ));
}

// Pi may be installed globally and therefore not resolvable from this repository. Find its dist/ by
// reading the `pi` shim's target, then walking up to the package root.
async function resolvePiDist() {
  const candidates = [];
  try {
    const { execFileSync } = await import('node:child_process');
    const which = execFileSync('which', ['pi'], { encoding: 'utf8' }).trim();
    if (which) {
      const shim = readFileSync(which, 'utf8');
      const target = shim.match(/cmd-shim-target=(.+)/)?.[1]?.trim();
      if (target) {
        const marker = 'node_modules/@earendil-works/pi-coding-agent';
        const idx = target.indexOf(marker);
        if (idx !== -1) candidates.push(target.slice(0, idx + marker.length));
      }
    }
  } catch {
    // which/pi unavailable; fall through.
  }
  for (const pkgRoot of candidates) {
    const dist = join(pkgRoot, 'dist');
    if (existsSync(join(dist, 'core', 'skills.js'))) return dist;
  }
  return null;
}

const failures = [];
const warnings = [];
const fail = (message) => failures.push(message);
const warn = (message) => warnings.push(message);

const settingsPath = join(repoRoot, '.pi', 'settings.json');
if (!existsSync(settingsPath)) {
  console.error('pi:check: .pi/settings.json is missing — run `pnpm pi:sync`.');
  process.exit(1);
}
const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
const agentDir =
  process.env.PI_AGENT_DIR ?? join(process.env.HOME ?? '', '.pi', 'agent');

// The runtime must reference canonical content, never copy it. A materialized tree under .pi/ is a
// second source of truth — the drift the harness forbids. .pi/agents is the one allowed projection.
for (const dir of ['skills', 'prompts', 'rules']) {
  if (existsSync(join(repoRoot, '.pi', dir))) {
    fail(
      `.pi/${dir}/ exists — canonical content must be referenced directly, never copied. Remove it.`,
    );
  }
}
// Every referenced path must resolve into harness-core (direct reference, not a projection).
for (const key of ['skills', 'prompts']) {
  for (const entry of settings[key] ?? []) {
    const target = resolve(repoRoot, entry);
    if (!existsSync(target)) {
      fail(
        `${key}: \`${entry}\` does not resolve to a path under the repository.`,
      );
    } else if (
      !relative(join(repoRoot, 'harness-core'), target).startsWith('..')
    ) {
      // good — inside harness-core
    } else if (!relative(join(repoRoot, '.pi'), target).startsWith('..')) {
      // allowed only for the harness extension, handled separately
    } else {
      warn(
        `${key}: \`${entry}\` points outside harness-core — expected a direct reference.`,
      );
    }
  }
}

// --- packages ---------------------------------------------------------------------------------

const packageSkillPaths = [];
const packagePromptPaths = [];
for (const source of settings.packages ?? []) {
  const match = /^npm:(.+)$/.exec(source);
  if (!match) continue;
  const pkgName = match[1].replace(/@[^/@]+$/, '');
  const pkgRoot = join(repoRoot, '.pi', 'npm', 'node_modules', pkgName);
  if (!existsSync(pkgRoot)) {
    fail(`${source}: not installed — run \`pi install\``);
    continue;
  }
  const manifest = JSON.parse(
    readFileSync(join(pkgRoot, 'package.json'), 'utf8'),
  );
  for (const p of manifest.pi?.skills ?? [])
    packageSkillPaths.push(join(pkgRoot, p));
  for (const p of manifest.pi?.prompts ?? [])
    packagePromptPaths.push(join(pkgRoot, p));
  for (const p of manifest.pi?.extensions ?? []) {
    if (!existsSync(join(pkgRoot, p)))
      fail(`${source}: missing extension ${p}`);
  }
}

// --- loader round ----------------------------------------------------------------------------

const projectSkills = loadSkills({
  cwd: repoRoot,
  agentDir,
  skillPaths: settings.skills ?? [],
  includeDefaults: false,
});
const projectPrompts = loadPromptTemplates({
  cwd: repoRoot,
  agentDir,
  promptPaths: settings.prompts ?? [],
  includeDefaults: false,
});
const allSkills = loadSkills({
  cwd: repoRoot,
  agentDir,
  skillPaths: [...(settings.skills ?? []), ...packageSkillPaths],
  includeDefaults: false,
});
const allPrompts = loadPromptTemplates({
  cwd: repoRoot,
  agentDir,
  promptPaths: [...(settings.prompts ?? []), ...packagePromptPaths],
  includeDefaults: false,
});

// --- agents -----------------------------------------------------------------------------------

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

// Agents live directly under .pi/agents as <plugin>__<agent>.md. Everything else under .pi/ is a
// skill or a prompt, and a SKILL.md also has a `name:` in its frontmatter — scanning by frontmatter
// alone would treat every skill as an agent and report the harness as full of agents with no tools.
function scanAgents(dir) {
  const found = [];
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...scanAgents(full));
      continue;
    }
    if (!entry.name.endsWith('.md')) continue;
    if (!full.split('/').includes('agents')) continue;
    const body = readFileSync(full, 'utf8');
    const fm = FRONTMATTER.exec(body)?.[1] ?? '';
    const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim();
    if (name) {
      found.push({
        name,
        path: full,
        frontmatter: fm,
        body: body.slice(fm.length),
      });
    }
  }
  return found;
}

const agents = scanAgents(join(repoRoot, '.pi', 'agents')).sort((a, b) =>
  a.name.localeCompare(b.name),
);

// --- checks -----------------------------------------------------------------------------------

// Parses a frontmatter field that may be an inline comma list (`tools: a, b`) or a block list
// (`tools:\n  - a`). Mirrors how smoke.mjs reads the same fields, so the two checks agree.
function parseListField(fm, key) {
  const inline = new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(fm);
  if (inline && !/^\s*-/.test(inline[1])) {
    return inline[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const out = [];
  let capture = false;
  for (const line of fm.split('\n')) {
    if (new RegExp(`^${key}:\\s*$`).test(line)) {
      capture = true;
      continue;
    }
    if (!capture) continue;
    const m = /^\s+-\s+(.+)$/.exec(line);
    if (m) out.push(m[1].trim());
    else if (line.trim() === '') continue;
    else break;
  }
  return out;
}

if (agents.length === 0) {
  fail(
    'no agents discovered under .pi/agents — the generated tree is empty or misplaced',
  );
}

const dispatchers = agents.filter(
  (a) =>
    /^tools:.*\bsubagent\b/m.test(a.frontmatter) ||
    /allowNestedSubagents:\s*true/.test(a.frontmatter),
);

const seen = new Map();
for (const agent of agents) {
  if (seen.has(agent.name)) {
    fail(
      `duplicate agent name \`${agent.name}\`: ${relative(repoRoot, seen.get(agent.name))} and ${relative(repoRoot, agent.path)}`,
    );
  }
  seen.set(agent.name, agent.path);

  const fm = agent.frontmatter;
  const toolList = parseListField(fm, 'tools');
  const denied = /^permission:\n((?:[ \t]+.*\n?)*)/m.exec(fm)?.[1] ?? '';
  const canWrite = toolList.includes('edit') || toolList.includes('write');

  // A read-only agent must not be able to edit. This is the strongest boundary the runtime offers, and
  // it is the one a generated regression would silently remove.
  if (!canWrite && !/write:\s*deny/.test(denied)) {
    fail(
      `${relative(repoRoot, agent.path)}: holds no edit/write tool but does not deny them`,
    );
  }
  if (canWrite && /write:\s*deny/.test(denied)) {
    fail(
      `${relative(repoRoot, agent.path)}: holds edit/write but the generated permission block denies them — every task would fail closed`,
    );
  }

  // Exactly one dispatcher. A second dispatcher is a second place the process lives.
  if (
    dispatchers.length > 1 &&
    dispatchers.some((d) => d.name !== agent.name)
  ) {
    fail(
      `more than one agent may dispatch: ${dispatchers.map((d) => `\`${d.name}\``).join(', ')}. The process has exactly one owner.`,
    );
  }

  // Every allowedAgents entry must resolve, or a dispatch silently falls back to a default.
  const allowed = parseListField(fm, 'allowedAgents');
  for (const name of allowed) {
    if (!agents.some((a) => a.name === name)) {
      fail(
        `${relative(repoRoot, agent.path)}: allowedAgents names \`${name}\`, which no agent answers to`,
      );
    }
  }

  // An agent frontmatter must not declare a model. The policy decides, and a local value is the one
  // that gets ignored.
  for (const banned of ['model', 'thinking', 'modelOverrides']) {
    if (new RegExp(`^${banned}:`, 'm').test(fm)) {
      fail(
        `${relative(repoRoot, agent.path)}: declares \`${banned}:\`. The model policy decides; this value is the one that gets ignored.`,
      );
    }
  }
}

// Model policy must cover every agent, and the rendered overrides must match it.
const overrides = settings.subagents?.agentOverrides ?? {};
for (const agent of agents) {
  if (!overrides[agent.name]) {
    fail(
      `model policy: agent \`${agent.name}\` has no rendered override. It runs at the pi default and nothing says so.`,
    );
  }
}
for (const name of Object.keys(overrides)) {
  if (!agents.some((a) => a.name === name)) {
    fail(
      `model policy: rendered override for \`${name}\`, which no agent answers to`,
    );
  }
}

// --- skills and prompts -----------------------------------------------------------------------

const skillIds = new Set();
for (const skill of projectSkills.skills) {
  if (skillIds.has(skill.name)) {
    fail(
      `duplicate skill name \`${skill.name}\` — one of the two is invisible at load time`,
    );
  }
  skillIds.add(skill.name);
}

if (projectPrompts.templates.length === 0) {
  fail(
    'no workflow prompts loaded — check the `prompts:` paths in .pi/settings.json',
  );
}

// The loaders report what they could not use as diagnostics. A diagnostic is not a failure by itself —
// a package may ship something this project does not consume — but one naming a generated file is a
// generated file the runtime will not read.
for (const diagnostic of [
  ...(allSkills.diagnostics ?? []),
  ...(allPrompts.diagnostics ?? []),
]) {
  const text =
    typeof diagnostic === 'string' ? diagnostic : JSON.stringify(diagnostic);
  if (/\.pi\//.test(text)) warn(`loader diagnostic: ${text}`);
}

// --- report -----------------------------------------------------------------------------------

console.log(
  `skills:  ${projectSkills.skills.length} project, ${allSkills.skills.length} total`,
);
console.log(
  `prompts: ${projectPrompts.templates.length} project, ${allPrompts.templates.length} total`,
);
console.log(
  `agents:  ${agents.length} discovered (${agents.map((a) => a.name).join(', ')})`,
);
console.log(
  `model:   ${Object.keys(overrides).length} agents carry a rendered tier`,
);

for (const w of warnings) console.log(`  WARN ${w}`);
for (const f of failures) console.error(`  FAIL ${f}`);

if (failures.length > 0) {
  console.error(`pi:check: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("pi runtime OK — pi's own loaders accepted the generated output");

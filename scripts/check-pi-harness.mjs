#!/usr/bin/env node
// Validates the pi harness in .pi/ using pi's own resource loaders, so the check
// fails for the same reasons pi would fail at startup. Run via `pnpm pi-check`.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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
      'pi-check: could not locate @earendil-works/pi-coding-agent. Install pi (npm i -g @earendil-works/pi-coding-agent) or add it as a devDependency.',
    );
    process.exit(2);
  }
  ({ loadSkills } = await import(join(distRoot, 'core', 'skills.js')));
  ({ loadPromptTemplates } = await import(
    join(distRoot, 'core', 'prompt-templates.js')
  ));
}

// pi may be installed globally (not resolvable from this repo). Find its dist/
// by reading the `pi` shim's cmd-shim-target, then walking up to the package root.
async function resolvePiDist() {
  const candidates = [];
  try {
    const { execFileSync } = await import('node:child_process');
    const which = execFileSync('which', ['pi'], { encoding: 'utf8' }).trim();
    if (which) {
      const shim = readFileSync(which, 'utf8');
      const target = shim.match(/cmd-shim-target=(.+)/)?.[1]?.trim();
      if (target) {
        // .../node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js
        const marker = 'node_modules/@earendil-works/pi-coding-agent';
        const idx = target.indexOf(marker);
        if (idx !== -1) candidates.push(target.slice(0, idx + marker.length));
      }
    }
  } catch {
    // which/pi unavailable; fall through
  }
  for (const pkgRoot of candidates) {
    const dist = join(pkgRoot, 'dist');
    if (existsSync(join(dist, 'core', 'skills.js'))) return dist;
  }
  return null;
}

const settings = JSON.parse(
  readFileSync(join(repoRoot, '.pi/settings.json'), 'utf8'),
);
const agentDir =
  process.env.PI_AGENT_DIR ?? join(process.env.HOME ?? '', '.pi', 'agent');

const EXPECTED_SKILLS = 14;
const EXPECTED_PROMPTS = 9;
const EXPECTED_AGENTS = [
  'orchestrator',
  'architect',
  'scout',
  'frontend',
  'dev',
  'review',
  'backend',
  'tester',
  'reviewer',
  'oracle',
  'browser-verifier',
];

const failures = [];
const warnings = [];

// Project packages declared in settings.json. npm sources install under .pi/npm,
// which .pi/npm/.gitignore excludes, so a fresh clone must run `pi install`.
const packageSkillPaths = [];
const packagePromptPaths = [];
for (const source of settings.packages ?? []) {
  const match = /^npm:(.+)$/.exec(source);
  if (!match) continue;
  const pkgName = match[1].replace(/@[^/@]+$/, '');
  const pkgRoot = join(repoRoot, '.pi', 'npm', 'node_modules', pkgName);
  if (!existsSync(pkgRoot)) {
    failures.push(`${source}: not installed — run \`pi install\``);
    continue;
  }
  const manifest = JSON.parse(
    readFileSync(join(pkgRoot, 'package.json'), 'utf8'),
  );
  for (const path of manifest.pi?.skills ?? [])
    packageSkillPaths.push(join(pkgRoot, path));
  for (const path of manifest.pi?.prompts ?? [])
    packagePromptPaths.push(join(pkgRoot, path));
  for (const path of manifest.pi?.extensions ?? []) {
    if (!existsSync(join(pkgRoot, path)))
      failures.push(`${source}: missing extension ${path}`);
  }
}

const skills = loadSkills({
  cwd: repoRoot,
  agentDir,
  skillPaths: [...(settings.skills ?? []), ...packageSkillPaths],
  includeDefaults: false,
});

const prompts = loadPromptTemplates({
  cwd: repoRoot,
  agentDir,
  promptPaths: [...(settings.prompts ?? []), ...packagePromptPaths],
  includeDefaults: false,
});

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

if (projectSkills.skills.length !== EXPECTED_SKILLS) {
  failures.push(
    `expected ${EXPECTED_SKILLS} project skills, pi loaded ${projectSkills.skills.length}`,
  );
}
if (projectPrompts.templates.length !== EXPECTED_PROMPTS) {
  failures.push(
    `expected ${EXPECTED_PROMPTS} project prompt commands, pi loaded ${projectPrompts.templates.length}`,
  );
}

// These files are pi-owned, so pi's own warnings are treated as failures: an invalid
// skill name or unparseable frontmatter silently breaks a command even though the
// resource still loads.
for (const diagnostic of [...skills.diagnostics, ...prompts.diagnostics]) {
  const where = diagnostic.path.replace(`${repoRoot}/`, '');
  const message = diagnostic.message.split('\n')[0];
  failures.push(`${where}: ${message}`);
  if (diagnostic.type === 'warning') warnings.push(`${where}: ${message}`);
}

const duplicateNames = skills.skills
  .map((s) => s.name)
  .filter((name, index, all) => all.indexOf(name) !== index);

console.log(
  `skills:  ${projectSkills.skills.length}/${EXPECTED_SKILLS} project, ${skills.skills.length} total`,
);
console.log(
  `prompts: ${projectPrompts.templates.length}/${EXPECTED_PROMPTS} project, ${prompts.templates.length} total`,
);

// --- Agent discovery ---

function scanAgents(dir) {
  const agents = [];
  if (!existsSync(dir)) return agents;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'references' || entry.name === 'skills') continue;
      agents.push(...scanAgents(full));
    } else if (
      entry.name.endsWith('.md') &&
      !entry.name.startsWith('.') &&
      entry.name !== 'SKILL.md' &&
      entry.name !== 'references'
    ) {
      const raw = readFileSync(full, 'utf8');
      const match = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!match) {
        warnings.push(`${full.replace(repoRoot + '/', '')}: no frontmatter`);
        continue;
      }
      const fm = match[1];
      const nameMatch = fm.match(/^name:\s*(.+)/m);
      const descMatch = fm.match(/^description:\s*(.+)/m);
      const skillsMatch = fm.match(/^skills:\s*(.+)/m);
      agents.push({
        path: full,
        name: nameMatch?.[1]?.trim(),
        description: descMatch?.[1]?.trim(),
        skills: skillsMatch?.[1]
          ?.split(/\s*,\s*/)
          .map((s) => s.trim())
          .filter(Boolean),
      });
    }
  }
  return agents;
}

const discoveredAgents = scanAgents(join(repoRoot, '.pi', 'agents'));
const discoveredNames = discoveredAgents.map((a) => a.name).filter(Boolean);

// Check required agents exist
for (const expected of EXPECTED_AGENTS) {
  if (!discoveredNames.includes(expected)) {
    failures.push(`agent not found: ${expected}`);
  }
}

// Check agent frontmatter validity
const knownSkillNames = new Set(projectSkills.skills.map((s) => s.name));

// Agent-private skills (discovered via skillPath, not in settings.skills)
// Finds any skills/ directory at any depth under .pi/agents/
function scanAgentPrivateSkills() {
  const found = [];
  const agentsRoot = join(repoRoot, '.pi', 'agents');
  if (!existsSync(agentsRoot)) return found;

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (!entry.isDirectory()) continue;
      if (entry.name === 'skills') {
        for (const skillEntry of readdirSync(full, { withFileTypes: true })) {
          const skillFile = join(full, skillEntry.name, 'SKILL.md');
          if (!skillEntry.isDirectory() || !existsSync(skillFile)) continue;
          const raw = readFileSync(skillFile, 'utf8');
          const nameMatch = raw.match(/^name:\s*(.+)/m);
          const name = nameMatch?.[1]?.trim();
          if (name) {
            found.push({
              name,
              path: skillFile,
              agent: relative(agentsRoot, dir),
            });
            knownSkillNames.add(name);
          }
        }
      } else {
        walk(full);
      }
    }
  }
  walk(agentsRoot);
  return found;
}

const privateSkills = scanAgentPrivateSkills();

for (const agent of discoveredAgents) {
  if (!agent.name) {
    failures.push(
      `${agent.path.replace(repoRoot + '/', '')}: missing name in frontmatter`,
    );
    continue;
  }
  if (!agent.description) {
    warnings.push(`${agent.name}: missing description`);
  }
  // Check skill references
  for (const skill of agent.skills ?? []) {
    if (!knownSkillNames.has(skill)) {
      failures.push(`agent ${agent.name} references unknown skill: ${skill}`);
    }
  }
}

console.log(
  `agents:  ${discoveredNames.length} discovered (required: ${EXPECTED_AGENTS.join(', ')})`,
);
console.log(
  `agent-private skills: ${privateSkills.length} (${privateSkills.map((s) => s.name).join(', ') || 'none'})`,
);

// Deduplicate agent names
const agentNameCounts = {};
for (const name of discoveredNames)
  agentNameCounts[name] = (agentNameCounts[name] || 0) + 1;
for (const [name, count] of Object.entries(agentNameCounts)) {
  if (count > 1)
    failures.push(`duplicate agent name: ${name} (${count} files)`);
}

for (const warning of warnings) console.warn(`warn  ${warning}`);
for (const duplicate of new Set(duplicateNames))
  failures.push(`duplicate skill name: ${duplicate}`);

if (failures.length > 0) {
  for (const failure of failures) console.error(`fail  ${failure}`);
  process.exit(1);
}

console.log('pi harness OK');

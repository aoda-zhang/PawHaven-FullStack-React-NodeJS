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

const EXPECTED_SKILLS = 18;
const EXPECTED_PRIVATE_SKILLS = 9;
const EXPECTED_PROMPTS = 9;
const EXPECTED_AGENTS = [
  'orchestrator',
  'architect',
  'scout',
  'frontend-dev',
  'backend-dev',
  'tester',
  'reviewer',
  'oracle',
  'browser-verifier',
];

// Escape hatch for a project skill that is reachable some way other than an agent's
// `skills:` grant. The eight doctors `code-review` dispatches to by path at review time are
// reached through that meta-skill's dispatch table, not through frontmatter, so requiring a
// grant for them would only push someone to add a redundant one. `react-doctor` is deliberately
// NOT in this list: `frontend-dev` runs it as a mandatory self-check and needs the pinned
// version, so its grant is what keeps the pinned version in the skill instead of restated in a
// prompt body. Add a name here ONLY with the indirection that reaches it written in the comment.
const CATALOG_ONLY_SKILLS = [
  'architecture-doctor',
  'backend-doctor',
  'boundary-doctor',
  'i18n-doctor',
  'style-doctor',
  'test-doctor',
  'typecheck-doctor',
  'typescript-doctor',
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
      const allowedMatch = fm.match(/^allowedAgents:\s*(.+)/m);
      const skillPathMatch = fm.match(/^skillPath:\s*(.+)/m);
      const inheritSkillsMatch = fm.match(/^inheritSkills:\s*(.+)/m);
      const splitList = (value) =>
        value
          ?.split(/\s*,\s*/)
          .map((s) => s.trim())
          .filter(Boolean);
      agents.push({
        path: full,
        name: nameMatch?.[1]?.trim(),
        description: descMatch?.[1]?.trim(),
        skills: splitList(skillsMatch?.[1]),
        allowedAgents: splitList(allowedMatch?.[1]),
        skillPath: skillPathMatch?.[1]?.trim(),
        inheritSkills: inheritSkillsMatch?.[1]?.trim(),
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
              agentSkillDir: full,
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

if (privateSkills.length !== EXPECTED_PRIVATE_SKILLS) {
  failures.push(
    `expected ${EXPECTED_PRIVATE_SKILLS} agent-private skills, found ${privateSkills.length}`,
  );
}

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

// --- Reference resolution ---

// An agent name that resolves to nothing is not an error anywhere in pi: the
// dispatch silently falls back to a default agent, and the only thing lost is the
// methodology the lane was supposed to carry. Rename one lane and every pointer to
// it keeps working while pointing somewhere else, so the name must be checked against
// the agents actually discovered on disk.
for (const agent of discoveredAgents) {
  for (const allowed of agent.allowedAgents ?? []) {
    if (!discoveredNames.includes(allowed)) {
      failures.push(
        `agent ${agent.name} allows unknown agent: ${allowed} (allowedAgents)`,
      );
    }
  }
}

// Same failure one layer out: an agentOverrides key left behind by a rename is inert,
// so the renamed agent silently runs at pi's default thinking level.
for (const key of Object.keys(settings.subagents?.agentOverrides ?? {})) {
  if (!discoveredNames.includes(key)) {
    failures.push(`settings.json agentOverrides has unknown agent: ${key}`);
  }
}

// And one layer deeper still, in the skills themselves: a `requiredAgents` array naming an
// agent that no longer exists. `task-classification` fixes that array as its contract and its
// worked examples are copied verbatim by whoever runs them, so a name left behind by a rename
// becomes a dispatch that resolves to nothing — and nothing else here reads a skill's body.
// Only the array is parsed, never prose.
function scanSkillMarkdown(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) scanSkillMarkdown(full, found);
    else if (entry.name.endsWith('.md')) found.push(full);
  }
  return found;
}

for (const file of scanSkillMarkdown(join(repoRoot, '.pi', 'skills'))) {
  const raw = readFileSync(file, 'utf8');
  for (const match of raw.matchAll(/"requiredAgents"\s*:\s*\[([^\]]*)\]/g)) {
    const bodyStart = match.index + match[0].length - match[1].length;
    for (const entry of match[1].matchAll(/"([^"]+)"/g)) {
      if (!discoveredNames.includes(entry[1])) {
        const line = raw.slice(0, bodyStart + entry.index).split('\n').length;
        failures.push(
          `${relative(repoRoot, file)}:${line}: requiredAgents names unknown agent: ${entry[1]}`,
        );
      }
    }
  }
}

// skillPath is discovery-only. A typo'd or moved path resolves to nothing and the
// agent loses its private skills with no diagnostic anywhere — it just runs with less
// methodology than its own definition claims.
const privateSkillDirs = new Set();
for (const agent of discoveredAgents) {
  if (!agent.skillPath) continue;
  const resolved = resolve(dirname(agent.path), agent.skillPath);
  privateSkillDirs.add(resolved);
  if (!existsSync(resolved)) {
    failures.push(
      `agent ${agent.name}: skillPath does not exist: ${agent.skillPath} (${relative(repoRoot, resolved)})`,
    );
  }
}

// The inverse: a private skill no agent's skillPath reaches is dead weight. Nothing
// loads it, and because it still parses as a valid skill it looks live on disk.
for (const skill of privateSkills) {
  if (
    ![...privateSkillDirs].some(
      (dir) => resolve(dir) === resolve(skill.agentSkillDir),
    )
  ) {
    failures.push(
      `agent-private skill unreachable from any skillPath: ${skill.name} (${relative(repoRoot, skill.path)})`,
    );
  }
}

// Every project skill must be granted somewhere. This is the check that keeps a
// project skill from becoming invisible: a doctor promoted from agent-private to
// project is only loaded by an agent if that agent still grants it, and dropping the
// grant is invisible to every other check here.
const grantedSkills = new Set();
for (const agent of discoveredAgents) {
  for (const skill of agent.skills ?? []) grantedSkills.add(skill);
}
for (const skill of projectSkills.skills) {
  if (grantedSkills.has(skill.name) || CATALOG_ONLY_SKILLS.includes(skill.name))
    continue;
  failures.push(`project skill granted by no agent: ${skill.name}`);
}

// `inheritSkills: false` strips Pi's whole discovered skills catalog, and pi selects what
// remains purely from `skills:`. An agent that declares it while granting nothing therefore
// runs with zero skills — no diagnostic, and nothing in the body to say so, since prose
// describing a rule is not a grant. Pair the two.
for (const agent of discoveredAgents) {
  if (agent.inheritSkills === 'false' && !(agent.skills?.length > 0)) {
    failures.push(
      `agent ${agent.name}: inheritSkills: false with no skills: grant — it would run with no skills at all`,
    );
  }
}

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

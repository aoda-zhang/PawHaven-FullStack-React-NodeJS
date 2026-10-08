#!/usr/bin/env node
// Validates harness-core: that the canonical harness is internally correct, provider-neutral, and
// free of second sources of truth — and that no part of the retired architecture remains.
//
//   node harness-core/validation/validate-core.mjs
//
// This file must stay runtime-agnostic. It imports the model policy reader — which reads a YAML file
// in this repository and knows nothing about any runtime — and nothing else. If it ever needs to
// import a runtime's loader, the boundary has been crossed and the check belongs in that runtime's
// adapter instead.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveTiers } from '../config/model-policy.mjs';

const harnessCore = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(harnessCore, '..');

const failures = [];
const fail = (message) => failures.push(message);

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'npm' || entry.name === 'node_modules') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
};

const rel = (file) => relative(repoRoot, file);
const mdFiles = walk(harnessCore).filter((f) => f.endsWith('.md'));
const allFiles = walk(harnessCore);

// --- frontmatter ------------------------------------------------------------------------------

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

function parseFrontmatter(file) {
  const body = readFileSync(file, 'utf8');
  const match = FRONTMATTER.exec(body);
  if (!match) return { data: {}, content: body, missing: true };
  const data = {};
  let list = null;
  for (const line of match[1].split('\n')) {
    if (/^\s*#/.test(line) || line.trim() === '') continue;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && list) {
      list.push(item[1].trim());
      continue;
    }
    const pair = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (!pair) continue;
    const key = pair[1];
    const value = pair[2].trim();
    if (value === '') {
      list = [];
      data[key] = list;
    } else {
      list = null;
      data[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return { data, content: body.slice(match[0].length), missing: false };
}

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

function basenameOf(file) {
  return file.split(sep).pop().replace(/\.md$/, '');
}

// --- 0. the retired architecture must not exist ------------------------------------------------
//
// The hard requirement: the old structure is gone, not kept around under a compatibility alias.

for (const deadDir of [
  'harness-core/capabilities',
  'harness-core/plugins/development-foundations',
]) {
  if (existsSync(join(repoRoot, deadDir))) {
    fail(
      `\`${deadDir}\` still exists. The harness moved capabilities → plugins; this directory is retired and must be deleted.`,
    );
  }
}
// The generated tree must not contain any directory from the old Pi layout.
for (const deadGeneratedDir of [
  '.pi/capabilities',
  '.pi/workflows',
  '.pi/policies',
]) {
  if (existsSync(join(repoRoot, deadGeneratedDir))) {
    fail(
      `\`${deadGeneratedDir}\` still exists under .pi/. Run \`pnpm harness:generate\` to replace the old generated layout.`,
    );
  }
}

// --- 1. plugin packages ----------------------------------------------------------------------

const pluginsDir = join(harnessCore, 'plugins');
if (!existsSync(pluginsDir)) {
  fail(
    'harness-core/plugins is missing. That is where every agent and skill lives.',
  );
}

const plugins = existsSync(pluginsDir)
  ? readdirSync(pluginsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
  : [];

if (plugins.length === 0) fail('harness-core/plugins is empty.');

for (const plugin of plugins) {
  const dir = join(pluginsDir, plugin);
  const entries = readdirSync(dir);
  const unexpected = entries.filter(
    (e) => !['agents', 'skills', 'commands'].includes(e),
  );
  if (unexpected.length > 0) {
    fail(
      `plugin \`${plugin}\`: unexpected entries ${unexpected.join(', ')}. A plugin holds agents/, skills/, and optionally commands/ — nothing else.`,
    );
  }
  for (const expected of ['agents', 'skills', 'commands']) {
    if (
      entries.includes(expected) &&
      !statSync(join(dir, expected)).isDirectory()
    ) {
      fail(`plugin \`${plugin}\`: \`${expected}\` is not a directory`);
    }
  }
}

// --- 2. agents -------------------------------------------------------------------------------

const CANONICAL_TOOLS = new Set([
  'read',
  'search',
  'shell',
  'edit',
  'write',
  'dispatch',
]);
const AGENT_REQUIRED = ['name', 'description', 'modelTier', 'authority'];

const RUNTIME_AGENT_FIELDS = [
  'systemPromptMode',
  'inheritProjectContext',
  'inheritSkills',
  'defaultContext',
  'allowedAgents',
  'allowNestedSubagents',
  'maxSubagentDepth',
  'acceptanceRole',
  'agentScope',
  'color',
  'skillPath',
];

const agentFiles = plugins.flatMap((plugin) =>
  walk(join(pluginsDir, plugin, 'agents'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ plugin, file: f })),
);

const agentNames = new Map();

for (const { plugin, file } of agentFiles) {
  const where = rel(file);
  const { data, content, missing } = parseFrontmatter(file);
  if (missing) {
    fail(`${where}: no YAML frontmatter.`);
    continue;
  }
  for (const field of AGENT_REQUIRED) {
    if (!data[field]) fail(`${where}: frontmatter is missing \`${field}\`.`);
  }
  const name = data.name;
  if (name && name !== basenameOf(file)) {
    fail(
      `${where}: frontmatter \`name: ${name}\` does not match the file name.`,
    );
  }
  if (name && agentNames.has(name)) {
    fail(
      `duplicate agent name \`${name}\`: ${agentNames.get(name)} and ${where}`,
    );
  }
  if (name) agentNames.set(name, where);

  if (data.authority && !['read-only', 'write'].includes(data.authority)) {
    fail(
      `${where}: \`authority: ${data.authority}\`. It is \`read-only\` or \`write\`.`,
    );
  }
  for (const tool of asList(data.tools)) {
    if (!CANONICAL_TOOLS.has(tool)) {
      fail(
        `${where}: \`${tool}\` is not a canonical tool. The vocabulary is closed: ${[...CANONICAL_TOOLS].join(', ')}. A runtime tool identifier belongs in the adapter.`,
      );
    }
  }
  const tools = asList(data.tools);
  if (
    data.authority === 'read-only' &&
    (tools.includes('edit') || tools.includes('write'))
  ) {
    fail(
      `${where}: \`authority: read-only\` but the tool list includes a mutation tool.`,
    );
  }
  if (tools.includes('dispatch') && tools.length === 0) {
    fail(`${where}: unreachable`);
  }

  for (const field of RUNTIME_AGENT_FIELDS) {
    if (data[field] !== undefined) {
      fail(
        `${where}: canonical agent frontmatter carries \`${field}\`, which is a runtime field. It belongs in the adapter that runtime reads.`,
      );
    }
  }

  if (/^\*\*Role:\*\*/m.test(content) || /^\*\*Domain:\*\*/m.test(content)) {
    fail(
      `${where}: body declares a Role or Domain. The plugin directory is the classification; a second copy in the body is a second thing to keep in sync.`,
    );
  }
}

// Exactly one dispatcher, in canonical terms too.
const dispatchers = agentFiles.filter((f) =>
  asList(parseFrontmatter(f.file).data.tools).includes('dispatch'),
);
if (dispatchers.length > 1) {
  fail(
    `more than one agent holds \`dispatch\`: ${dispatchers.map((f) => basenameOf(f.file)).join(', ')}. The process has exactly one owner.`,
  );
}

// --- 3. skills -------------------------------------------------------------------------------

const skillDirs = new Map();
const skillNames = new Map();

for (const plugin of plugins) {
  const skillsDir = join(pluginsDir, plugin, 'skills');
  if (!existsSync(skillsDir)) continue;
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (entry.isDirectory())
      skillDirs.set(`${plugin}/${entry.name}`, join(skillsDir, entry.name));
  }
}

for (const [skillDir, dir] of [...skillDirs.entries()].sort()) {
  const entry = join(dir, 'SKILL.md');
  if (!existsSync(entry)) {
    fail(
      `skill \`${skillDir}\`: no SKILL.md. A skill directory is identified by its SKILL.md.`,
    );
    continue;
  }
  const { data, missing } = parseFrontmatter(entry);
  if (missing) {
    fail(`skill \`${skillDir}\`: SKILL.md has no YAML frontmatter.`);
    continue;
  }
  const skillName = skillDir.split('/')[1];
  if (!data.name) fail(`skill \`${skillDir}\`: frontmatter has no \`name\`.`);
  else if (data.name !== skillName) {
    fail(
      `skill \`${skillDir}\`: frontmatter \`name: ${data.name}\` differs from the directory name, so one of the two resolves to nothing.`,
    );
  }
  if (!data.description)
    fail(`skill \`${skillDir}\`: frontmatter has no \`description\`.`);
  if (skillNames.has(skillName)) fail(`duplicate skill name \`${skillName}\``);
  skillNames.set(skillName, rel(entry));

  for (const child of readdirSync(dir)) {
    const allowed = ['SKILL.md', 'references', 'scripts', 'assets'];
    if (!allowed.includes(child)) {
      fail(
        `skill \`${skillDir}\`: unexpected entry \`${child}\`. A skill holds ${allowed.join(', ')}.`,
      );
    }
  }
  const body = readFileSync(entry, 'utf8');
  for (const child of readdirSync(dir)) {
    const childDir = join(dir, child);
    if (!statSync(childDir).isDirectory()) continue;
    for (const file of walk(childDir)) {
      const target = `${child}/${basenameOf(file)}`;
      if (!body.includes(target)) {
        fail(
          `skill \`${skillDir}\`: ${child}/${basenameOf(file)} is not named in SKILL.md. Nothing will open a file nothing points at.`,
        );
      }
    }
  }
}

const skillNamesList = [...skillNames.keys()];

// --- 4. workflows ----------------------------------------------------------------------------

const workflowDir = join(harnessCore, 'workflows');
const TASK_WORKFLOWS = [
  'feature-development',
  'bug-fix',
  'refactoring',
  'architecture-change',
  'investigation',
  'performance-issue',
];
const OPERATIONAL_WORKFLOWS = [
  'design-decision',
  'code-review',
  'handoff',
  'harness-change',
];
const workflowFiles = existsSync(workflowDir)
  ? readdirSync(workflowDir)
      .filter((e) => e.endsWith('.md'))
      .map((e) => e.replace(/\.md$/, ''))
      .sort()
  : [];
const patternFiles = existsSync(join(workflowDir, 'patterns'))
  ? readdirSync(join(workflowDir, 'patterns'))
      .filter((e) => e.endsWith('.md'))
      .map((e) => e.replace(/\.md$/, ''))
      .sort()
  : [];

const workflowNames = new Set();
for (const file of walk(workflowDir).filter((f) => f.endsWith('.md'))) {
  const name = relative(workflowDir, file).replace(/\.md$/, '');
  if (workflowNames.has(name)) fail(`duplicate workflow name \`${name}\``);
  workflowNames.add(name);
  const { data, missing } = parseFrontmatter(file);
  if (missing)
    fail(`workflow \`${name}\`: no YAML frontmatter with a \`description\`.`);
  else if (!data.description)
    fail(`workflow \`${name}\`: frontmatter has no \`description\`.`);
}

for (const required of [
  ...TASK_WORKFLOWS,
  ...OPERATIONAL_WORKFLOWS,
  'harness-process',
]) {
  if (!workflowNames.has(required)) {
    fail(`workflows/${required}.md is missing.`);
  }
}
for (const pattern of patternFiles) {
  if (
    TASK_WORKFLOWS.includes(pattern) ||
    OPERATIONAL_WORKFLOWS.includes(pattern)
  ) {
    fail(
      `workflows/patterns/${pattern}.md is a pattern, not a task type. Routing must not select it; reach it from the workflow that uses it.`,
    );
  }
}

// --- 5. rules --------------------------------------------------------------------------------

const rulesDir = join(harnessCore, 'rules');
const rules = existsSync(rulesDir)
  ? readdirSync(rulesDir)
      .filter((e) => e.endsWith('.md'))
      .map((e) => e.replace(/\.md$/, ''))
      .sort()
  : [];
for (const required of ['verification', 'failure', 'contract', 'human-gates']) {
  if (!rules.includes(required)) fail(`rules/${required}.md is missing.`);
}

// --- 6. model policy -------------------------------------------------------------------------

let tiers = {};
try {
  ({ agents: tiers } = resolveTiers(repoRoot));
} catch (error) {
  fail(`model policy: ${error.message}`);
}

for (const { file } of agentFiles) {
  const { data } = parseFrontmatter(file);
  const name = data.name;
  if (!name) continue;
  if (!data.modelTier) continue;
  if (!tiers[name]) {
    fail(
      `${rel(file)}: agent \`${name}\` has no tier in model-policy.yaml. Its intelligence would fall to a runtime default and nothing would say so.`,
    );
  } else if (tiers[name].tier !== data.modelTier) {
    fail(
      `${rel(file)}: declares \`modelTier: ${data.modelTier}\` but model-policy.yaml says \`${tiers[name].tier}\`. Two answers to one question.`,
    );
  }
}
for (const name of Object.keys(tiers)) {
  if (!agentNames.has(name)) {
    fail(
      `model-policy.yaml assigns a tier to \`${name}\`, which is not an agent in plugins/.`,
    );
  }
}

const PROVIDER_MODEL =
  /\b(gpt-[0-9]|claude-[0-9]|sonnet|opus|haiku|gemini-[0-9]|mimo|deepseek-|llama-?[0-9])/i;
for (const file of allFiles) {
  if (file.endsWith('.mjs')) continue;
  const body = readFileSync(file, 'utf8');
  const hit = PROVIDER_MODEL.exec(body);
  if (hit) {
    fail(
      `${rel(file)}: contains \`${hit[1]}\`, which names a provider model. Canonical source declares an abstract tier; the provider mapping belongs in an adapter.`,
    );
  }
}

// --- 7. references, grants, and dependency direction ------------------------------------------

const SKILL_TO_WORKFLOW_ALLOWLIST = [
  {
    file: 'harness-core/plugins/code-review/skills/code-review/SKILL.md',
    reason:
      'The skill is the review METHOD; the workflow is the run that applies it end to end. Naming the workflow says where the sequence lives, and the skill states that it does not own it. Without this pointer a reader who has the method has no way to find the run.',
  },
  {
    file: 'harness-core/plugins/code-review/skills/code-review/references/performance.md',
    reason:
      'This reference is the review DIMENSION; performance-issue.md is the investigation that measures ' +
      'and fixes a known bottleneck. The reference has to say the two are deliberately different, or a ' +
      'reviewer tries to run a measurement a review cannot take.',
  },
];

const LINK = /\]\(([^)\s]+)\)/g;
const agentNameSet = new Set(agentNames.keys());

for (const file of mdFiles) {
  const body = readFileSync(file, 'utf8');
  const isSkill = file.endsWith('SKILL.md');
  const relativeToPlugins = file.startsWith(pluginsDir);

  for (const match of body.matchAll(LINK)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|tel:|data:)/.test(target)) continue;
    const path = target.split('#')[0];
    if (!path) continue;
    const resolved = resolve(dirname(file), path);
    if (!existsSync(resolved)) {
      fail(`${rel(file)}: link target does not exist — ${target}`);
      continue;
    }

    if (
      isSkill ||
      (relativeToPlugins && !file.includes(`${sep}agents${sep}`))
    ) {
      const inside = relative(resolve(harnessCore), resolved);
      if (inside.startsWith(`workflows${sep}`)) {
        const authorised = SKILL_TO_WORKFLOW_ALLOWLIST.find(
          (entry) => entry.file === rel(file),
        );
        if (!authorised) {
          fail(
            `ARCHITECTURE_VIOLATION: ${rel(file)}: a skill links into the workflows. The workflow owns the sequence; a skill reaching up into it is a second place the process lives.`,
          );
        } else if (!authorised.reason || authorised.reason.length < 40) {
          fail(
            `${rel(file)}: the skill → workflow allowlist entry has no usable reason. An entry without one is a rule that was given away.`,
          );
        }
      }
      if (
        inside.startsWith(`plugins${sep}`) &&
        inside.includes(`${sep}agents${sep}`)
      ) {
        fail(
          `ARCHITECTURE_VIOLATION: ${rel(file)}: a skill links to an agent. A skill teaches a capability; it does not dispatch one.`,
        );
      }
    }
  }

  if (file.includes(`${sep}agents${sep}`)) {
    const { data } = parseFrontmatter(file);
    for (const granted of asList(data.skills)) {
      if (!skillNames.has(granted)) {
        fail(
          `${rel(file)}: grants skill \`${granted}\`, which no skill answers to. The agent quietly runs without it.`,
        );
      }
    }
  }

  if (
    !file.includes(`${sep}agents${sep}`) &&
    relativeToPlugins &&
    !file.includes('harness-maintenance')
  ) {
    const sentences = body.split(/(?<=[.!?])\s+|\n+/);
    for (const name of agentNameSet) {
      for (const sentence of sentences) {
        if (!sentence.includes(`\`${name}\``)) continue;
        if (
          !/\b(dispatch|route|hand|sent to|send to|delegate|spawn|call)\b/i.test(
            sentence,
          )
        )
          continue;
        fail(
          `ARCHITECTURE_VIOLATION: ${rel(file)}: routes work to the agent \`${name}\`. A skill teaches a capability; it does not dispatch one.`,
        );
      }
    }
  }
}

const grantedSkills = new Set();
for (const { file } of agentFiles) {
  for (const granted of asList(parseFrontmatter(file).data.skills))
    grantedSkills.add(granted);
}
for (const skill of skillNamesList) {
  if (grantedSkills.has(skill)) continue;
  if (skill === 'code-review') continue;
  if (
    skill === 'testing-frontend' ||
    skill === 'backend-testing' ||
    skill === 'browser-verification'
  ) {
    continue;
  }
  const entryPath = join(repoRoot, skillNames.get(skill));
  const body = readFileSync(entryPath, 'utf8');
  const reachable = mdFiles.some((f) => {
    if (f === entryPath) return false;
    const other = readFileSync(f, 'utf8');
    return (
      other.includes(`${skill}/SKILL.md`) || other.includes(`\`${skill}\``)
    );
  });
  if (!reachable) {
    fail(
      `orphan skill \`${skill}\`: no agent grants it and nothing references it.`,
    );
  }
}

// A workflow or rule must not reach into a runtime's generated output.
for (const file of walk(workflowDir)
  .concat(walk(rulesDir))
  .filter((f) => f.endsWith('.md'))) {
  const body = readFileSync(file, 'utf8');
  if (/\]\(\.\.\/\.\.\/\.pi\//.test(body) || /\]\(\.pi\//.test(body)) {
    fail(
      `${rel(file)}: a workflow or rule links into a generated runtime directory. Canonical source does not know what a runtime lays out.`,
    );
  }
}

// --- 8. no second source of truth ------------------------------------------------------------

// The canonical source must not point at generated runtime output. The current generated layout
// (.pi/agents, .pi/skills, .pi/prompts) is legitimate to *describe*, so only the retired directories
// are forbidden here.
const retiredInGenerated = [
  '.pi/workflows/',
  '.pi/policies/',
  '.pi/config/',
  '.pi/rules/',
];
for (const file of mdFiles) {
  const body = readFileSync(file, 'utf8');
  for (const needle of retiredInGenerated) {
    if (body.includes(needle)) {
      fail(
        `${rel(file)}: references \`${needle}\`, which is generated runtime output. The canonical source must not point at a directory an adapter can delete.`,
      );
    }
  }
}

// A canonical file must not reference the retired architecture by path. The migration-history doc is the
// one exception: it records how the harness got here and is not active architecture.
for (const file of mdFiles) {
  const where = rel(file);
  if (where === 'docs/architecture/harness-migration.md') continue;
  const body = readFileSync(file, 'utf8');
  const oldArch =
    /\bcapabilities\//.test(body) ||
    /development-foundations/.test(body) ||
    /\.pi\/workflows/.test(body) ||
    /\.pi\/capabilities/.test(body) ||
    /\.pi\/policies/.test(body);
  if (oldArch) {
    fail(
      `${where}: references the retired architecture (capabilities/, development-foundations, .pi/workflows, .pi/capabilities, or .pi/policies). Use plugins/ and the Pi-native .pi/ layout instead.`,
    );
  }
}

// --- 9. the retired doctor-per-rule architecture ------------------------------------------------

const DOCTOR_NAMES = [
  'architecture-doctor',
  'backend-doctor',
  'boundary-doctor',
  'i18n-doctor',
  'react-doctor-as-doctor',
  'style-doctor',
  'test-doctor',
  'typecheck-doctor',
  'typescript-doctor',
];
for (const name of DOCTOR_NAMES) {
  if (existsSync(join(harnessCore, 'plugins', name))) {
    fail(
      `\`${name}\` exists as a plugin. The doctor-per-rule architecture was replaced by one code-review plugin with review dimensions.`,
    );
  }
}
for (const [skillDir] of skillDirs) {
  if (/^[a-z-]+-doctor$/.test(skillDir) && skillDir !== 'react-doctor') {
    fail(
      `skill \`${skillDir}\` is a per-rule doctor. A dimension is a review question, not a skill; the rule belongs to the skill that owns the domain and the detection to the review dimension.`,
    );
  }
}

// --- report -----------------------------------------------------------------------------------

const counts = {
  plugins: plugins.length,
  agents: agentFiles.length,
  skills: skillNamesList.length,
  workflows: workflowNames.size,
  patterns: patternFiles.length,
  rules: rules.length,
};
console.log(
  `harness-core: ${counts.plugins} plugins, ${counts.agents} agents, ${counts.skills} skills, ` +
    `${counts.workflows} workflows (${counts.patterns} patterns), ${counts.rules} rules, ${failures.length} failures`,
);
if (failures.length > 0) {
  for (const f of failures) console.error(`  FAIL ${f}`);
  console.error(`validate-core: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log(
  'canonical harness OK — provider-neutral, internally consistent, no second source of truth, no retired architecture',
);

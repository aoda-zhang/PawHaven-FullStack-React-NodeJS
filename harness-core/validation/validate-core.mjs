#!/usr/bin/env node
// Validates harness-core: that the canonical harness is internally correct, provider-neutral, and
// free of second sources of truth.
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

// --- 1. capability packages -------------------------------------------------------------------

const capabilitiesDir = join(harnessCore, 'capabilities');
if (!existsSync(capabilitiesDir)) {
  fail(
    'harness-core/capabilities is missing. That is where every agent and skill lives.',
  );
}

const capabilities = existsSync(capabilitiesDir)
  ? readdirSync(capabilitiesDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
  : [];

if (capabilities.length === 0) fail('harness-core/capabilities is empty.');

for (const capability of capabilities) {
  const dir = join(capabilitiesDir, capability);
  const entries = readdirSync(dir);
  const unexpected = entries.filter((e) => !['agents', 'skills'].includes(e));
  if (unexpected.length > 0) {
    fail(
      `capability \`${capability}\`: unexpected entries ${unexpected.join(', ')}. A capability holds agents/ and skills/, and nothing else.`,
    );
  }
  for (const expected of ['agents', 'skills']) {
    if (
      entries.includes(expected) &&
      !statSync(join(dir, expected)).isDirectory()
    ) {
      fail(`capability \`${capability}\`: \`${expected}\` is not a directory`);
    }
  }
}

// --- 2. agents --------------------------------------------------------------------------------

const CANONICAL_TOOLS = new Set([
  'read',
  'search',
  'shell',
  'edit',
  'write',
  'dispatch',
]);
const AGENT_REQUIRED = ['name', 'description', 'modelTier', 'authority'];

// Runtime-specific field names that must never appear in canonical source. Each is a real field in
// some runtime's agent frontmatter; a canonical file carrying one is runtime knowledge in the wrong
// layer, and the second runtime will read it as noise.
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

const agentFiles = capabilities.flatMap((capability) =>
  walk(join(capabilitiesDir, capability, 'agents'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ capability, file: f })),
);

const agentNames = new Map();

for (const { capability, file } of agentFiles) {
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
  if (tools.includes('dispatch') && !asList(data.tools).length) {
    fail(`${where}: unreachable`);
  }

  for (const field of RUNTIME_AGENT_FIELDS) {
    if (data[field] !== undefined) {
      fail(
        `${where}: canonical agent frontmatter carries \`${field}\`, which is a runtime field. It belongs in the adapter that runtime reads.`,
      );
    }
  }

  // The removed second classification. The capability directory already says which bundle owns this
  // agent; a role/domain line in the body is a second copy of that, and it drifts.
  if (/^\*\*Role:\*\*/m.test(content) || /^\*\*Domain:\*\*/m.test(content)) {
    fail(
      `${where}: body declares a Role or Domain. The capability directory is the classification; a second copy in the body is a second thing to keep in sync.`,
    );
  }
}

function basenameOf(file) {
  return file.split(sep).pop().replace(/\.md$/, '');
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

// --- 3. skills --------------------------------------------------------------------------------

const skillFiles = capabilities.flatMap((capability) =>
  walk(join(capabilitiesDir, capability, 'skills'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ capability, file: f })),
);

const skillNames = new Map();
const skillDirs = new Map();

// A skill directory is a direct child of a capability's `skills/`. Descending further would treat
// `references/` as a skill, which is the one thing the structure forbids.
for (const capability of capabilities) {
  const skillsDir = join(capabilitiesDir, capability, 'skills');
  if (!existsSync(skillsDir)) continue;
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (entry.isDirectory())
      skillDirs.set(entry.name, join(skillsDir, entry.name));
  }
}

for (const [skillDir, dir] of skillDirs) {
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
  if (!data.name) fail(`skill \`${skillDir}\`: frontmatter has no \`name\`.`);
  else if (data.name !== skillDir) {
    fail(
      `skill \`${skillDir}\`: frontmatter \`name: ${data.name}\` differs from the directory name, so one of the two resolves to nothing.`,
    );
  }
  if (!data.description)
    fail(`skill \`${skillDir}\`: frontmatter has no \`description\`.`);
  if (skillNames.has(data.name)) {
    fail(
      `duplicate skill name \`${data.name}\`: ${skillNames.get(data.name)} and ${rel(entry)}`,
    );
  }
  skillNames.set(data.name, rel(entry));

  // A skill directory holds only these. A README or a NOTES file is a second document with no owner.
  for (const child of readdirSync(dir)) {
    const allowed = ['SKILL.md', 'references', 'scripts', 'assets'];
    if (!allowed.includes(child)) {
      fail(
        `skill \`${skillDir}\`: unexpected entry \`${child}\`. A skill holds ${allowed.join(', ')}.`,
      );
    }
  }
  // Every file under references/ or scripts/ must be reachable from SKILL.md, or it is a file nobody
  // will open because nothing names it.
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

// --- 4. workflows -----------------------------------------------------------------------------

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

// --- 5. rules ---------------------------------------------------------------------------------

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

// --- 6. model policy --------------------------------------------------------------------------

let tiers = {};
try {
  ({ agents: tiers } = resolveTiers(repoRoot));
} catch (error) {
  fail(`model policy: ${error.message}`);
}

for (const { capability, file } of agentFiles) {
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
      `model-policy.yaml assigns a tier to \`${name}\`, which is not an agent in capabilities/.`,
    );
  }
}

// A provider or model identifier in canonical source is a policy that has leaked into an adapter.
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

// A skill may point at a workflow ONLY to name where a process lives. Needing the workflow to run, or
// routing work to one, inverts workflow → agent → skill, and the skill would become a second place the
// process is written down.
//
// Each entry authorises exactly one pointer, on one file, with a reason that is not optional: a new
// entry ships with the argument that earned it, because every entry is a place the dependency
// direction had to be argued for rather than followed.
const SKILL_TO_WORKFLOW_ALLOWLIST = [
  {
    file: 'harness-core/capabilities/code-review/skills/code-review/SKILL.md',
    reason:
      'The skill is the review METHOD; the workflow is the run that applies it end to end. Naming the workflow says where the sequence lives, and the skill states that it does not own it. Without this pointer a reader who has the method has no way to find the run.',
  },
  {
    file: 'harness-core/capabilities/code-review/skills/code-review/references/performance.md',
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
  const relativeToCapabilities = file.startsWith(capabilitiesDir);

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

    // A skill must not route work to an agent or start a workflow. That inverts
    // workflow → agent → skill, and it is silent: the skill loads cleanly and behaves differently.
    if (
      isSkill ||
      (relativeToCapabilities && !file.includes(`${sep}agents${sep}`))
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
        inside.startsWith(`capabilities${sep}`) &&
        inside.includes(`${sep}agents${sep}`)
      ) {
        fail(
          `ARCHITECTURE_VIOLATION: ${rel(file)}: a skill links to an agent. A skill teaches a capability; it does not dispatch one.`,
        );
      }
    }
  }

  // An agent's skill grants must resolve.
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

  // Backticked agent names in a skill are a dispatch in disguise — but only when the sentence around
  // them routes work. Naming which agent owns a neighbouring question is how a review dimension tells
  // the reviewer where the boundary is, and that is the skill doing its job.
  if (
    !file.includes(`${sep}agents${sep}`) &&
    relativeToCapabilities &&
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

// An orphan component is a promise nobody keeps: nothing can reach it, so it drifts from everything
// that can.
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
    // Reached deliberately rather than granted: these three are requested by an agent that needs them
    // for a specific piece of work, and granting them permanently would load a second stack of
    // guidance on every unrelated task. The workflow names them.
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

// A workflow must not reach into a runtime's generated output.
for (const file of walk(workflowDir)
  .concat(walk(rulesDir))
  .filter((f) => f.endsWith('.md'))) {
  const body = readFileSync(file, 'utf8');
  if (/]\(\.\.\/\.\.\/\.pi\//.test(body) || /\]\(\.pi\//.test(body)) {
    fail(
      `${rel(file)}: a workflow or rule links into a generated runtime directory. Canonical source does not know what a runtime lays out.`,
    );
  }
}

// --- 8. no second source of truth -------------------------------------------------------------

// The generated tree must not be reachable as a source. A rule that names it as its authority is a
// second registry wearing a generated directory's name.
const retiredInGenerated = [
  '.pi/skills/',
  '.pi/agents/',
  '.pi/workflows/',
  '.pi/policies/',
  '.pi/config/',
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
  if (existsSync(join(harnessCore, 'capabilities', name))) {
    fail(
      `\`${name}\` exists as a capability. The doctor-per-rule architecture was replaced by one code-review capability with review dimensions.`,
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
  capabilities: capabilities.length,
  agents: agentFiles.length,
  skills: skillNamesList.length,
  workflows: workflowNames.size,
  patterns: patternFiles.length,
  rules: rules.length,
};
console.log(
  `harness-core: ${counts.capabilities} capabilities, ${counts.agents} agents, ${counts.skills} skills, ` +
    `${counts.workflows} workflows (${counts.patterns} patterns), ${counts.rules} rules, ${counts.failure ?? failures.length} failures`,
);
if (failures.length > 0) {
  for (const f of failures) console.error(`  FAIL ${f}`);
  console.error(`validate-core: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log(
  'canonical harness OK — provider-neutral, internally consistent, no second source of truth',
);

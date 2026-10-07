#!/usr/bin/env node
// The real Pi smoke test. Filesystem validation is not enough: the questions here are whether Pi
// actually DISCOVERS the generated agents, whether a granted skill resolves to something in the
// catalog Pi loaded, whether the coordinating agent can reach every other agent, and whether the
// model policy was actually applied to the runtime configuration.
//
//   node harness-core/adapters/pi/smoke.mjs
//
// Everything it asserts is read back out of the generated `.pi/` tree through Pi's own loaders, so a
// generator that writes something plausible but unusable fails here.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveTiers } from '../../config/model-policy.mjs';

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
  const { execFileSync } = await import('node:child_process');
  const which = execFileSync('which', ['pi'], { encoding: 'utf8' }).trim();
  const shim = readFileSync(which, 'utf8');
  const target = shim.match(/cmd-shim-target=(.+)/)?.[1]?.trim() ?? '';
  const marker = 'node_modules/@earendil-works/pi-coding-agent';
  const idx = target.indexOf(marker);
  if (idx === -1) {
    console.error(
      'pi smoke: could not locate the pi runtime. Install it, or add it as a devDependency.',
    );
    process.exit(2);
  }
  const dist = join(target.slice(0, idx + marker.length), 'dist');
  ({ loadSkills } = await import(join(dist, 'core', 'skills.js')));
  ({ loadPromptTemplates } = await import(
    join(dist, 'core', 'prompt-templates.js')
  ));
}

const settings = JSON.parse(
  readFileSync(join(repoRoot, '.pi', 'settings.json'), 'utf8'),
);
const agentDir =
  process.env.PI_AGENT_DIR ?? join(process.env.HOME ?? '', '.pi', 'agent');

const FRONTMATTER = /^---\n([\s\S]*?)\n---/;

// Parses the generated frontmatter the way a YAML loader would: a scalar, an inline comma list, or a
// block list. Parsing only the inline form would silently read every generated skill grant as empty
// and report a harness that grants nothing.
function frontmatterField(fm, key) {
  const lines = fm.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const match = new RegExp(`^${key}:\\s*(.*)$`).exec(lines[i]);
    if (!match) continue;
    const value = match[1].trim();
    if (value === '>' || value === '|' || value === '>-' || value === '|-') {
      const collected = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) {
        collected.push(lines[i + 1].trim());
        i += 1;
      }
      return collected.join(' ');
    }
    if (value === '') {
      const items = [];
      while (i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) {
        items.push(lines[i + 1].trim().replace(/^-\s+/, ''));
        i += 1;
      }
      return items;
    }
    return value
      .replace(/^['"]|['"]$/g, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

const results = [];
const pass = (name, detail = '') => results.push({ ok: true, name, detail });
const fail = (name, detail) => results.push({ ok: false, name, detail });

// --- 1. Pi discovers the generated skills -------------------------------------------------------

const skills = loadSkills({
  cwd: repoRoot,
  agentDir,
  skillPaths: settings.skills ?? [],
  includeDefaults: false,
});
const prompts = loadPromptTemplates({
  cwd: repoRoot,
  agentDir,
  promptPaths: settings.prompts ?? [],
  includeDefaults: false,
});
const skillNames = new Set(skills.skills.map((s) => s.name));
const promptNames = new Set(
  prompts.templates.map((t) => t.name ?? t.id ?? t.command ?? ''),
);

pass(
  'skills loaded by pi',
  `${skills.skills.length} skills: ${[...skillNames].sort().join(', ')}`,
);

const REQUIRED_SKILLS = [
  'principles',
  'task-classification',
  'architecture-design',
  'frontend-patterns',
  'react-doctor',
  'testing-frontend',
  'backend',
  'backend-testing',
  'typescript',
  'writing-standards',
  'testing-standards',
  'browser-verification',
  'code-review',
  'agent-authoring',
  'skill-authoring',
  'harness-validation',
];
const missingSkills = REQUIRED_SKILLS.filter((s) => !skillNames.has(s));
if (missingSkills.length === 0)
  pass('every canonical skill is discoverable by pi');
else fail('missing skills', missingSkills.join(', '));

// --- 2. Pi discovers the workflow prompts --------------------------------------------------------

const REQUIRED_PROMPTS = [
  'feature-development',
  'bug-fix',
  'refactoring',
  'architecture-change',
  'investigation',
  'performance-issue',
  'design-decision',
  'code-review',
  'handoff',
  'harness-change',
  'harness-process',
  'parallel-execution',
];
const missingPrompts = REQUIRED_PROMPTS.filter((p) => !promptNames.has(p));
if (missingPrompts.length === 0) {
  pass(
    `every workflow prompt is discoverable by pi (${prompts.templates.length})`,
  );
} else {
  fail(
    'missing prompts',
    `${missingPrompts.join(', ')} — loaded: ${[...promptNames].sort().join(', ')}`,
  );
}

// --- 3. Pi discovers the generated agents -------------------------------------------------------

function readAgent(file) {
  const body = readFileSync(file, 'utf8');
  const fm = FRONTMATTER.exec(body)?.[1] ?? '';
  return {
    file,
    body,
    fm,
    name: frontmatterField(fm, 'name')[0],
    description: frontmatterField(fm, 'description'),
    tools: frontmatterField(fm, 'tools'),
    skills: frontmatterField(fm, 'skills'),
    allowedAgents: frontmatterField(fm, 'allowedAgents'),
    nested: /allowNestedSubagents:\s*true/.test(fm),
    maxDepth: frontmatterField(fm, 'maxSubagentDepth')[0],
    denied: /write:\s*deny/.test(fm) && /edit:\s*deny/.test(fm),
  };
}

// Agents live under a capability's `agents/` directory. A SKILL.md also carries a `name:`, so scanning
// by frontmatter alone would count every skill as an agent and report 58 agents where there are nine.
const agentFiles = [];
const collectAgents = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectAgents(full);
    else if (entry.name.endsWith('.md') && full.split('/').includes('agents'))
      agentFiles.push(full);
  }
};
collectAgents(join(repoRoot, '.pi', 'capabilities'));
const agents = agentFiles.map(readAgent);
const agentsByName = new Map(agents.map((a) => [a.name, a]));

const REQUIRED_AGENTS = [
  'orchestrator',
  'scout',
  'architect',
  'oracle',
  'frontend-developer',
  'backend-developer',
  'tester',
  'reviewer',
  'browser-verifier',
];
const missingAgents = REQUIRED_AGENTS.filter((a) => !agentsByName.has(a));
if (missingAgents.length === 0) pass(`all ${agents.length} agents discovered`);
else fail('missing agents', missingAgents.join(', '));

// A generated agent whose description lost its folded block arrives in the runtime as a one-line stub,
// and nothing in a loader check notices — the agent is discoverable and simply never chosen.
const described = agents.filter((a) => {
  const d = Array.isArray(a.description)
    ? a.description.join(' ')
    : a.description;
  return (
    typeof d === 'string' &&
    d.trim().length > 40 &&
    d.trim() !== '>' &&
    d.trim() !== '|'
  );
});
if (described.length === agents.length) {
  pass(
    'every agent description survived generation',
    `${agents.length} non-empty descriptions`,
  );
} else {
  const empty = agents.filter((a) => !described.includes(a)).map((a) => a.name);
  fail('agent descriptions', `empty or stubbed: ${empty.join(', ')}`);
}

// --- 4. The coordinating agent can dispatch to every other agent ---------------------------------

const orchestrator = agentsByName.get('orchestrator');
if (orchestrator) {
  const canDispatch =
    orchestrator.tools.includes('subagent') && orchestrator.nested;
  const unreachable = REQUIRED_AGENTS.filter(
    (n) => n !== 'orchestrator' && !orchestrator.allowedAgents.includes(n),
  );
  if (canDispatch && unreachable.length === 0) {
    pass(
      'orchestrator can dispatch to every agent',
      `${orchestrator.allowedAgents.length} targets, maxSubagentDepth ${orchestrator.maxDepth}`,
    );
  } else {
    fail(
      'orchestrator dispatch',
      !canDispatch
        ? 'it does not hold the dispatch tool / nested dispatch is off'
        : `cannot reach: ${unreachable.join(', ')}`,
    );
  }

  // A second dispatcher would be a second place the process lives.
  const dispatchers = agents.filter(
    (a) => a.tools.includes('subagent') || a.nested,
  );
  if (dispatchers.length === 1) pass('exactly one agent may dispatch');
  else fail('multiple dispatchers', dispatchers.map((a) => a.name).join(', '));
} else {
  fail('orchestrator dispatch', 'the orchestrator agent was not generated');
}

// --- 5. Every granted skill resolves in the catalog Pi loaded -----------------------------------

let grantsOk = true;
const grantDetail = [];
for (const agent of agents) {
  const unresolved = agent.skills.filter((s) => !skillNames.has(s));
  if (unresolved.length > 0) {
    grantsOk = false;
    grantDetail.push(`${agent.name} → ${unresolved.join(', ')}`);
  }
}
if (grantsOk) {
  pass(
    'every skill grant resolves',
    `${agents.reduce((n, a) => n + a.skills.length, 0)} grants across ${agents.length} agents`,
  );
} else {
  fail('unresolved skill grants', grantDetail.join('; '));
}

// --- 6. The three role-critical grants specifically ----------------------------------------------

const REQUIRED_GRANTS = {
  reviewer: ['code-review', 'principles'],
  'frontend-developer': ['frontend-patterns', 'react-doctor', 'typescript'],
  'backend-developer': ['backend', 'typescript'],
  tester: ['testing-standards'],
  'browser-verifier': ['browser-verification'],
  architect: ['architecture-design'],
  oracle: ['architecture-design'],
  orchestrator: ['principles', 'task-classification'],
};
const grantProblems = [];
for (const [agentName, expected] of Object.entries(REQUIRED_GRANTS)) {
  const agent = agentsByName.get(agentName);
  if (!agent) {
    grantProblems.push(`${agentName} missing`);
    continue;
  }
  for (const skill of expected) {
    if (!agent.skills.includes(skill))
      grantProblems.push(`${agentName} lacks ${skill}`);
    if (!skillNames.has(skill))
      grantProblems.push(`${skill} is not in pi's catalog`);
  }
}
if (grantProblems.length === 0) {
  pass(
    'each agent receives its own methodology',
    'reviewer, frontend, backend, tester, verifier, planner',
  );
} else {
  fail('role grants', grantProblems.join('; '));
}

// --- 7. The model policy was applied to the runtime configuration ---------------------------------

const { agents: tierOfAgent } = resolveTiers(repoRoot);
const overrides = settings.subagents?.agentOverrides ?? {};
const tierProblems = [];
for (const [name, resolved] of Object.entries(tierOfAgent)) {
  const rendered = overrides[name];
  if (!rendered) {
    tierProblems.push(`${name} has no rendered tier`);
    continue;
  }
  if (rendered.thinking !== resolved.thinking) {
    tierProblems.push(
      `${name}: policy says ${resolved.thinking}, runtime has ${rendered.thinking}`,
    );
  }
  // A provider identifier must never be baked into a rendered tier unless the policy asked for one.
  if (rendered.model && resolved.model === 'inherit') {
    tierProblems.push(
      `${name}: policy says inherit, runtime pins ${rendered.model}`,
    );
  }
}
if (tierProblems.length === 0) {
  const summary = Object.entries(tierOfAgent)
    .map(([n, r]) => `${n}=${r.tier}/${r.thinking}`)
    .join(', ');
  pass('model policy applied to the runtime', summary);
} else {
  fail('model policy', tierProblems.join('; '));
}

// --- 8. Read-only agents really cannot write ----------------------------------------------------

const READ_ONLY = [
  'scout',
  'architect',
  'oracle',
  'tester',
  'reviewer',
  'browser-verifier',
];
const WRITE = ['frontend-developer', 'backend-developer'];
const writable = agents.filter(
  (a) => a.tools.includes('edit') || a.tools.includes('write'),
);
if (
  writable.length === WRITE.length &&
  WRITE.every((n) => writable.some((a) => a.name === n))
) {
  pass(
    'only the two implementation agents hold write tools',
    writable.map((a) => a.name).join(', '),
  );
} else {
  fail(
    'write boundary',
    `expected ${WRITE.join(', ')}, got ${writable.map((a) => a.name).join(', ') || 'none'}`,
  );
}
const notDenied = READ_ONLY.filter(
  (n) => agentsByName.get(n) && !agentsByName.get(n).denied,
);
if (notDenied.length === 0)
  pass('every read-only agent denies writes in the runtime');
else
  fail(
    'permission boundary',
    `${notDenied.join(', ')} hold no write tool but do not deny writes`,
  );

// --- 9. The retired doctor skills are gone -------------------------------------------------------

const retired = [
  'architecture-doctor',
  'backend-doctor',
  'boundary-doctor',
  'i18n-doctor',
  'style-doctor',
  'test-doctor',
  'typecheck-doctor',
  'typescript-doctor',
];
const stillPresent = retired.filter((s) => skillNames.has(s));
if (stillPresent.length === 0) pass('no per-rule doctor skill is loaded');
else fail('retired doctors still load', stillPresent.join(', '));

// --- report -------------------------------------------------------------------------------------

console.log('');
for (const r of results) {
  console.log(
    `${r.ok ? '  PASS' : '  FAIL'}  ${r.name}${r.detail ? ` — ${r.detail}` : ''}`,
  );
}
const failed = results.filter((r) => !r.ok);
console.log('');
if (failed.length > 0) {
  console.error(
    `pi smoke: ${failed.length} of ${results.length} checks failed`,
  );
  process.exit(1);
}
console.log(
  `pi smoke: ${results.length}/${results.length} — pi loads the generated skills, agents, and\n` +
    `           workflows; every grant resolves; the coordinator can dispatch; the model policy landed.`,
);

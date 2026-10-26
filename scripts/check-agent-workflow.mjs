#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function read(path, required = true) {
  const full = join(root, path);
  if (!existsSync(full)) {
    if (required) failures.push(`missing required workflow file: ${path}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

function frontmatter(content, name) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) {
    failures.push(`${name} is missing valid YAML frontmatter`);
    return '';
  }
  return match[1];
}

function deniesEdit(text) {
  const mapRules = [...text.matchAll(/^  edit:[ \t]*(allow|deny)[ \t]*$/gm)];
  if (mapRules.length) return mapRules.at(-1)[1] === 'deny';
  const listRules = [
    ...text.matchAll(
      /-\s*action:\s*edit\s*\n\s*resource:\s*['"]?\*['"]?\s*\n\s*effect:\s*(allow|deny)/gm,
    ),
  ];
  return listRules.length > 0 && listRules.at(-1)[1] === 'deny';
}

// OpenCode applies the last matching permission rule, so collect every
// wildcard bash rule (scalar, nested-map, and list form) and judge by position.
function deniesShell(text) {
  const rules = [];
  for (const m of text.matchAll(/^  bash:[ \t]*(allow|deny)[ \t]*$/gm)) {
    rules.push([m.index, m[1]]);
  }
  const block = text.match(/^  bash:[ \t]*\n((?: {4,}[^\n]*\n?)*)/m);
  if (block) {
    for (const m of block[1].matchAll(
      /['"]?\*['"]?[ \t]*:[ \t]*(allow|deny)/g,
    )) {
      rules.push([block.index + m.index, m[1]]);
    }
  }
  for (const m of text.matchAll(
    /-\s*action:\s*bash\s*\n\s*resource:\s*['"]?\*['"]?\s*\n\s*effect:\s*(allow|deny)/gm,
  )) {
    rules.push([m.index, m[1]]);
  }
  if (!rules.length) return false;
  rules.sort((a, b) => a[0] - b[0]);
  return rules.at(-1)[1] === 'deny';
}

function checkSkill(name, review = false) {
  const content = read(`.opencode/skills/${name}/SKILL.md`);
  const meta = frontmatter(content, `skill ${name}`);
  if (!new RegExp(`^name:\\s*${name}\\s*$`, 'm').test(meta)) {
    failures.push(`Skill frontmatter name must be ${name}`);
  }
  if (
    review &&
    !/finding format defined by the Reviewer agent/i.test(content)
  ) {
    failures.push(
      `${name} must reference the shared finding format instead of duplicating it`,
    );
  }
}

function requirePattern(content, pattern, message) {
  if (!pattern.test(content)) failures.push(message);
}

const agentNames = [
  'orchestrator',
  'architect',
  'explorer',
  'implementer',
  'tester',
  'reviewer',
  'pr-reviewer',
];
const agents = Object.fromEntries(
  agentNames.map((name) => [name, read(`.opencode/agents/${name}.md`)]),
);
const commands = Object.fromEntries(
  ['feature', 'bug-fix', 'refactor', 'document'].map((name) => [
    name,
    read(`.opencode/commands/${name}.md`),
  ]),
);
const config = read('.opencode/opencode.json');
const constraints = read('docs/context/agent-constraints.md');
const instructions = read('AGENTS.md');
const prWorkflow = read('.github/workflows/opencode-review.yml');
const teamGuide = read('docs/how-i-build/how-i-build-my-agent-team.md');

for (const name of ['frontend', 'backend', 'build']) {
  if (existsSync(join(root, `.opencode/agents/${name}.md`)))
    failures.push(
      `fixed ${name} agent must be removed; route from actual scope`,
    );
}
if (!/"default_agent"\s*:\s*"orchestrator"/.test(config))
  failures.push('default_agent must remain orchestrator');

if (
  !deniesEdit(frontmatter(agents.orchestrator, 'orchestrator')) ||
  !/explicit approval/i.test(agents.orchestrator) ||
  !/actual.*scope|scope.*actual/i.test(agents.orchestrator) ||
  !/not a fixed domain label|fixed frontend\/backend lanes/i.test(
    agents.orchestrator,
  )
) {
  failures.push(
    'orchestrator must deny edits, require approval, and route from actual scope, not fixed lanes',
  );
}
if (
  !/explicitly approved/i.test(agents.implementer) ||
  !/`development`/.test(agents.implementer) ||
  !/`ui-component-catalog`/.test(agents.implementer) ||
  !/action:\s*skill/.test(frontmatter(agents.implementer, 'implementer'))
) {
  failures.push(
    'implementer must require approval and route through development Skills',
  );
}
if (!/`verification`/.test(agents.tester)) {
  failures.push(
    'tester must load shared verification guidance and relevant test Skills',
  );
}
for (const skill of [
  'development',
  'verification',
  'ui-component-catalog',
  'code-commit',
])
  checkSkill(skill);
checkSkill('code-review', true);
for (const name of ['code-review']) {
  if (!agents.reviewer.includes(name) || !agents['pr-reviewer'].includes(name))
    failures.push(
      `reviewer and pr-reviewer must route to ${name} when applicable`,
    );
}
for (const [name, content] of Object.entries(commands)) {
  if (
    !/wait for explicit user approval|wait for explicit approval/i.test(
      content,
    ) ||
    !/before (any )?(modification|editing|modifying files)/i.test(content)
  ) {
    failures.push(`${name} command must enforce approval before modifications`);
  }
}
if (
  !/approval before every modification/i.test(constraints) ||
  !/No size-, urgency-, reversibility-, or domain-based exception/i.test(
    constraints,
  )
) {
  failures.push(
    'canonical constraints must require approval before every modification without exceptions',
  );
}
if (
  !/agent-constraints\.md/.test(instructions) ||
  !/explicit user approval/i.test(instructions)
) {
  failures.push(
    'AGENTS.md must point to canonical constraints and state the approval gate',
  );
}
const prMeta = frontmatter(agents['pr-reviewer'], 'pr-reviewer');
if (
  !/edit:\s*deny/.test(prMeta) ||
  !deniesShell(prMeta) ||
  !/agent:\s*pr-reviewer/.test(prWorkflow) ||
  !/contents:\s*read/.test(prWorkflow) ||
  /contents:\s*write/.test(prWorkflow) ||
  !/pull-requests:\s*write/.test(prWorkflow)
) {
  failures.push(
    'PR review must remain read-only for repository contents and use the dedicated reviewer',
  );
}

requirePattern(
  teamGuide,
  /Agent execution matrix/i,
  'agent-team guide must document the execution matrix',
);
requirePattern(
  teamGuide,
  /Parallelization contract/i,
  'agent-team guide must document parallelization conditions',
);
requirePattern(
  teamGuide,
  /Human approval/i,
  'agent-team guide must retain the human approval gate',
);
requirePattern(
  agents.orchestrator,
  /Parallelization gate/i,
  'orchestrator must define a parallelization gate',
);
requirePattern(
  agents.architect,
  /work units/i,
  'architect must define bounded work units',
);
requirePattern(
  agents.architect,
  /file ownership/i,
  'architect must define file ownership boundaries',
);
requirePattern(
  agents.implementer,
  /Never concurrently edit the same file/i,
  'implementer must prevent concurrent file-write conflicts',
);
requirePattern(
  agents.tester,
  /Before parallel execution/i,
  'tester must check isolation before parallel test execution',
);
requirePattern(
  agents.reviewer,
  /Loading multiple Skills.*does not create independent reviewers/i,
  'reviewer must distinguish Skills from independent reviewers',
);
requirePattern(
  agents.reviewer,
  /deduplicate/i,
  'reviewer must consolidate duplicate findings',
);

if (/\bscout\b/.test(commands['bug-fix']))
  failures.push('bug-fix command references undefined scout agent');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    'agent-workflow-check: OK — approval gates, scope-based Skill routing, parallelization safety, shared review format, and read-only PR review are configured',
  );
}

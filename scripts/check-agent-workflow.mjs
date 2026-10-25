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

function deniesEdit(frontmatterText) {
  return /-\s*action:\s*edit\s*\n\s*resource:\s*['"]?\*['"]?\s*\n\s*effect:\s*deny/m.test(frontmatterText);
}

const agents = {
  orchestrator: read('.opencode/agents/orchestrator.md'),
  implementer: read('.opencode/agents/implementer.md'),
};
const commands = {
  feature: read('.opencode/commands/feature.md'),
  bugFix: read('.opencode/commands/bug-fix.md'),
  refactor: read('.opencode/commands/refactor.md'),
};
const instructions = read('AGENTS.md');
const prReviewer = read('.opencode/agents/pr-reviewer.md');
const opencodeReviewWorkflow = read('.github/workflows/opencode-review.yml');
const constraints = read('docs/context/agent-constraints.md');
const configText = read('.opencode/opencode.json');
const buildPath = join(root, '.opencode/agents/build.md');

if (existsSync(buildPath)) {
  failures.push('custom build agent must be removed');
}
if (!/"default_agent"\s*:\s*"orchestrator"/.test(configText)) {
  failures.push('OpenCode default_agent must be orchestrator after removing the custom build agent');
}

const orchestratorFrontmatter = frontmatter(agents.orchestrator, 'orchestrator');
if (!deniesEdit(orchestratorFrontmatter) ||
    !/mandatory approval gate/i.test(agents.orchestrator) ||
    !/wait for the user to explicitly approve/i.test(agents.orchestrator) ||
    !/do not dispatch `implementer`/i.test(agents.orchestrator)) {
  failures.push('orchestrator must deny edits and require explicit approval before implementation dispatch');
}
if (!/explicit user approval/i.test(agents.implementer) ||
    !/if approval is absent, ambiguous/i.test(agents.implementer)) {
  failures.push('implementer must refuse edits without explicit approval of the current plan');
}
for (const [name, content] of Object.entries(commands)) {
  if (!/human approval gate/i.test(content) ||
      !/wait for explicit approval/i.test(content) ||
      !/do not edit files before approval|do not edit files or dispatch implementation/i.test(content)) {
    failures.push(`${name} command must enforce the same explicit approval gate`);
  }
  if (/small, reversible[^\n]*may proceed|small[^\n]*exception/i.test(content)) {
    failures.push(`${name} command must not contain a small-change approval exception`);
  }
}
if (!/before modifying any code, configuration, tests, scripts, or documentation/i.test(constraints) ||
    !/No size-, urgency-, reversibility-, or domain-based exception/i.test(constraints)) {
  failures.push('canonical agent constraints must define approval-before-modification without exceptions');
}
if (!/wait for explicit user approval/i.test(instructions) ||
    !/agent-constraints\.md/.test(instructions)) {
  failures.push('AGENTS.md must point to canonical constraints and state the approval gate');
}


const prReviewerFrontmatter = frontmatter(prReviewer, 'pr-reviewer');
if (!deniesEdit(prReviewerFrontmatter) ||
    !/-\s*action:\s*shell\s*\n\s*resource:\s*['"]?\*['"]?\s*\n\s*effect:\s*deny/m.test(prReviewerFrontmatter)) {
  failures.push('pr-reviewer must deny both edits and shell execution');
}
if (!/agent:\s*pr-reviewer/.test(opencodeReviewWorkflow) ||
    !/contents:\s*read/.test(opencodeReviewWorkflow) ||
    /contents:\s*write/.test(opencodeReviewWorkflow) ||
    !/pull-requests:\s*write/.test(opencodeReviewWorkflow)) {
  failures.push('OpenCode review workflow must use the read-only reviewer, keep repository contents read-only, and only allow PR feedback');
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exitCode = 1;
} else {
  console.log('agent-workflow-check: OK — orchestrator is the default entry point and all file-change entry points require explicit plan approval');
}

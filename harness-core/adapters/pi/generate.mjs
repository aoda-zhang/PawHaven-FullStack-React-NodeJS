#!/usr/bin/env node
// Generates the Pi runtime's configuration from harness-core.
//
//   node harness-core/adapters/pi/generate.mjs           # write .pi/
//   node harness-core/adapters/pi/generate.mjs --check   # exit 1 on drift, write nothing
//
// The canonical source is harness-core. Everything this script writes is disposable: delete it and run
// this again. Nothing here is hand-edited, because a hand-edit looks reviewed right up until the next
// run discards it.
//
// The generated tree MIRRORS the canonical tree under .pi/ — same directories, same depth, same file
// names — so every relative markdown link in a canonical file resolves identically in the generated
// copy. Rewriting links per runtime would mean a second place a link can be wrong; mirroring means a
// link is either right in both or wrong in both, and the link checker sees the same thing it sees in
// the source.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveTiers } from '../../config/model-policy.mjs';

const adapterDir = dirname(fileURLToPath(import.meta.url));
const harnessCore = resolve(adapterDir, '..', '..');
const repoRoot = resolve(harnessCore, '..');
const check = process.argv.includes('--check');

const GENERATED_HEADER =
  '<!-- GENERATED FILE. Do not edit. Source: harness-core/. Regenerate with `pnpm harness:generate`. -->\n';

// ---------------------------------------------------------------------------------------------
// Translation tables. Everything runtime-specific about Pi lives here and nowhere else.
// ---------------------------------------------------------------------------------------------

// Canonical capability names → Pi tool identifiers.
const TOOL_MAP = {
  read: ['read'],
  search: ['grep', 'find', 'ls'],
  shell: ['bash'],
  edit: ['edit'],
  write: ['write'],
  dispatch: ['subagent'],
};

// Pi-specific frontmatter that has no canonical counterpart. Each entry is an adapter decision, and
// the reason is the justification: canonical source stays runtime-neutral so that adding a second
// runtime does not mean rewriting nine agents.
const PI_AGENT_SETTINGS = {
  orchestrator: {
    // A fresh context per task is what makes a clean-context dispatch possible; the planner's
    // reasoning must not leak into the writer's.
    systemPromptMode: 'replace',
    inheritProjectContext: true,
    defaultContext: 'fresh',
    canDispatch: true,
  },
  scout: {
    // No systemPromptMode: scout inherits pi's base prompt, which is what makes it cheap.
    inheritProjectContext: true,
    defaultContext: 'fresh',
  },
  architect: {
    // The planning agent reads the architecture documents itself and must not arrive with the
    // orchestrator's framing already in its context.
    systemPromptMode: 'replace',
    inheritProjectContext: false,
  },
  oracle: {
    systemPromptMode: 'replace',
    inheritProjectContext: true,
    defaultContext: 'fresh',
  },
  'frontend-developer': {
    systemPromptMode: 'replace',
    inheritProjectContext: true,
    defaultContext: 'fresh',
  },
  'backend-developer': {
    systemPromptMode: 'replace',
    inheritProjectContext: true,
    defaultContext: 'fresh',
  },
  tester: {
    systemPromptMode: 'replace',
    inheritProjectContext: true,
    defaultContext: 'fresh',
  },
  reviewer: {
    systemPromptMode: 'replace',
    inheritProjectContext: true,
    // Forked: the review runs on the diff plus what the reviewer needs, not on the whole session.
    defaultContext: 'fork',
    // pi-subagents affordances with no canonical counterpart. The reviewer needs the change's diff
    // and a channel to report upward; neither is a responsibility, so neither belongs in canonical
    // source. Adding a third such tool means adding a line here with its reason.
    runtimeTools: ['watchdog_diff', 'contact_supervisor'],
  },
  'browser-verifier': {
    systemPromptMode: 'replace',
    inheritProjectContext: true,
    defaultContext: 'fresh',
  },
};

// Packages pi loads for this project. A runtime dependency is an adapter fact: the canonical source
// does not know that this harness runs inside pi, or that it delegates to a pi extension.
const PI_PACKAGES = ['npm:pi-subagents@0.76.0'];

const SETTINGS_SCHEMA =
  'https://raw.githubusercontent.com/earendil-works/pi/main/schema/settings.schema.json';

// ---------------------------------------------------------------------------------------------
// Canonical reading
// ---------------------------------------------------------------------------------------------

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
};

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

function parseFrontmatter(body, where) {
  const match = FRONTMATTER.exec(body);
  if (!match) throw new Error(`${where}: no YAML frontmatter.`);
  const lines = match[1].split('\n');
  const data = {};
  const order = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*#/.test(line) || line.trim() === '') continue;
    const pair = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (!pair) continue;
    const [, key, rawValue] = pair;
    const value = rawValue.trim();

    // A block scalar (`>` folded, `|` literal) continues on the following more-indented lines. Reading
    // only the indicator would silently drop the whole value, which is how an agent ends up generated
    // with an empty description and nothing notices until it is never dispatched.
    if (value === '>' || value === '|' || value === '>-' || value === '|-') {
      const collected = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) {
        collected.push(lines[i + 1].trim());
        i += 1;
      }
      data[key] = collected.join(value.startsWith('|') ? '\n' : ' ');
      order.push(key);
      continue;
    }

    // A block list: every following line indented with `- `.
    if (value === '') {
      const items = [];
      while (i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) {
        items.push(lines[i + 1].trim().replace(/^-\s+/, ''));
        i += 1;
      }
      data[key] = items;
      order.push(key);
      continue;
    }

    data[key] = value.replace(/^['"]|['"]$/g, '');
    order.push(key);
  }
  return { data, order, content: body.slice(match[0].length) };
}

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

function renderList(key, items, indent = 0) {
  const pad = ' '.repeat(indent);
  if (items.length === 0) return `${pad}${key}: []\n`;
  return `${pad}${key}:\n${items.map((i) => `${pad}  - ${i}`).join('\n')}\n`;
}

// ---------------------------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------------------------

/**
 * Build every artifact the Pi runtime needs, as a Map of repo-relative path → file content.
 * Pure: it reads the canonical source and writes nothing, so the drift check can call it and compare.
 */
export function buildArtifacts() {
  const artifacts = new Map();
  const { agents: tierOfAgent } = resolveTiers(repoRoot);

  // --- agents -------------------------------------------------------------------------------
  const agentFiles = walk(join(harnessCore, 'capabilities'))
    .filter((f) => f.endsWith('.md') && f.includes(`${sep}agents${sep}`))
    .sort();

  // Read every agent before rendering any of them. The coordinating agent's reach is a function of the
  // whole set, and computing it while rendering would depend on directory sort order — which is
  // exactly the class of bug that ships an agent that cannot reach two of its siblings and says
  // nothing about it.
  const parsedAgents = agentFiles.map((file) => {
    const rel = relative(harnessCore, file);
    const where = `harness-core/${rel}`;
    const { data, content } = parseFrontmatter(
      readFileSync(file, 'utf8'),
      where,
    );
    if (!data.name) throw new Error(`${where}: frontmatter has no \`name\`.`);
    return { file, rel, where, data, content };
  });
  const agentNames = parsedAgents.map((a) => a.data.name);
  const duplicate = agentNames.find((n, i) => agentNames.indexOf(n) !== i);
  if (duplicate) throw new Error(`two agents are both named \`${duplicate}\`.`);

  for (const { rel, where, data, content } of parsedAgents) {
    const name = data.name;

    const settings = PI_AGENT_SETTINGS[name];
    if (!settings) {
      throw new Error(
        `${where}: no Pi adapter settings for \`${name}\`. Every agent needs a decision here — the ` +
          `runtime has defaults the canonical source deliberately does not state, and an agent with no ` +
          `entry silently gets all of them.`,
      );
    }

    const authority = data.authority;
    const tools = asList(data.tools);
    const piTools = tools.flatMap((t) => {
      if (!TOOL_MAP[t]) {
        throw new Error(
          `${where}: \`${t}\` is not a canonical tool. The vocabulary is closed: ${Object.keys(TOOL_MAP).join(', ')}.`,
        );
      }
      return TOOL_MAP[t];
    });
    for (const extra of settings.runtimeTools ?? []) piTools.push(extra);

    const description = String(data.description ?? '').trim();
    if (description === '' || description === '>' || description === '|') {
      throw new Error(
        `${where}: \`description\` is empty. It is what a reader uses to choose this agent.`,
      );
    }

    const out = [`---`, `name: ${name}`];
    // A folded block scalar, because a description containing ": " would end a plain YAML scalar and
    // silently truncate the rest of the sentence.
    out.push('description: >-');
    out.push(`  ${description.split('\n').join(' ')}`);
    out.push(
      `acceptanceRole: ${authority === 'write' ? 'writer' : 'read-only'}`,
    );
    if (settings.systemPromptMode)
      out.push(`systemPromptMode: ${settings.systemPromptMode}`);
    out.push(
      `inheritProjectContext: ${settings.inheritProjectContext === true}`,
    );
    // No agent inherits the whole discovered catalog. Context is the cost being managed, and an agent
    // that carries skills it will not apply pays for them on every task.
    out.push(`inheritSkills: false`);
    out.push(renderList('skills', asList(data.skills)).trimEnd());
    out.push(`tools: ${piTools.join(', ')}`);
    if (authority === 'read-only') {
      out.push(`permission:`);
      out.push(`  write: deny`);
      out.push(`  edit: deny`);
    }
    if (settings.defaultContext)
      out.push(`defaultContext: ${settings.defaultContext}`);
    if (settings.canDispatch) {
      out.push(`allowNestedSubagents: true`);
      out.push(
        `allowedAgents: ${agentNames
          .filter((n) => n !== name)
          .sort()
          .join(', ')}`,
      );
      out.push(`maxSubagentDepth: 1`);
    }
    out.push('---', '');

    artifacts.set(
      join('.pi', rel),
      `${out.join('\n')}\n${GENERATED_HEADER}\n${content.trimStart()}`,
    );
  }

  // --- skills -------------------------------------------------------------------------------
  const skillDirs = [];
  for (const cap of readdirSync(join(harnessCore, 'capabilities'), {
    withFileTypes: true,
  })) {
    if (!cap.isDirectory()) continue;
    const skillsDir = join(harnessCore, 'capabilities', cap.name, 'skills');
    if (!existsSync(skillsDir)) continue;
    for (const skill of readdirSync(skillsDir, { withFileTypes: true })) {
      if (skill.isDirectory()) skillDirs.push(join(skillsDir, skill.name));
    }
  }
  for (const dir of skillDirs.sort()) {
    for (const file of walk(dir).sort()) {
      artifacts.set(
        join('.pi', relative(harnessCore, file)),
        readFileSync(file, 'utf8'),
      );
    }
  }

  // --- workflows ----------------------------------------------------------------------------
  for (const file of walk(join(harnessCore, 'workflows')).sort()) {
    artifacts.set(
      join('.pi', relative(harnessCore, file)),
      readFileSync(file, 'utf8'),
    );
  }

  // --- rules --------------------------------------------------------------------------------
  for (const file of walk(join(harnessCore, 'rules')).sort()) {
    artifacts.set(
      join('.pi', relative(harnessCore, file)),
      readFileSync(file, 'utf8'),
    );
  }

  // --- runtime settings ---------------------------------------------------------------------
  const agentOverrides = {};
  for (const name of [...agentNames].sort()) {
    const resolved = tierOfAgent[name];
    if (!resolved) {
      throw new Error(
        `model-policy.yaml: no tier for agent \`${name}\`. Every agent's intelligence is decided ` +
          `there, so an untiered agent runs at the runtime default and nothing says so.`,
      );
    }
    const override = { thinking: resolved.thinking };
    if (resolved.model !== 'inherit') override.model = resolved.model;
    agentOverrides[name] = override;
  }

  const settings = {
    $schema: SETTINGS_SCHEMA,
    // One root each. pi recurses into a directory looking for SKILL.md and stops at the first one it
    // finds, so a single root is correct here precisely because no skill contains another skill.
    skills: ['.pi/capabilities'],
    // pi's prompt loader scans one directory and does not descend, so every directory holding a
    // workflow is named. The patterns directory is listed because it is a real workflow pattern that
    // a workflow reaches for — it is not a task type, and routing never selects it.
    prompts: ['.pi/workflows', '.pi/workflows/patterns'],
    packages: PI_PACKAGES,
    subagents: { agentOverrides },
  };
  artifacts.set(
    join('.pi', 'settings.json'),
    `${JSON.stringify(settings, null, 2)}\n`,
  );

  // --- the runtime's own readme --------------------------------------------------------------
  artifacts.set(
    join('.pi', 'README.md'),
    `${GENERATED_HEADER}
# \`.pi/\` — generated Pi runtime output

**Everything in this directory is generated.** It is not the source of anything, and it is not edited
by hand. The canonical harness is [\`harness-core/\`](../harness-core/README.md); this directory is
what the Pi runtime loads.

\`\`\`bash
pnpm harness:generate   # rebuild this directory from the canonical source
pnpm pi:check           # prove the Pi loader accepts what is here
\`\`\`

Delete this directory and run \`pnpm harness:generate\` and it comes back identically. If it does not,
the source changed and nothing regenerated it — which is what
[\`harness:check:generated\`](../harness-core/validation/README.md) exists to catch.

| What Pi loads                                       | Generated from                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| \`.pi/capabilities/**/agents/*.md\`                   | \`harness-core/capabilities/**/agents/*.md\`                                 |
| \`.pi/capabilities/**/skills/*\`                      | \`harness-core/capabilities/**/skills/*\`                                    |
| \`.pi/workflows/*.md\`, \`.pi/workflows/patterns/*.md\` | \`harness-core/workflows/**\`                                                |
| \`.pi/rules/*.md\`                                    | \`harness-core/rules/*.md\`                                                  |
| \`.pi/settings.json\`                                 | \`harness-core/config/model-policy.yaml\` + the adapter's translation tables |

The tree mirrors the canonical tree directory for directory, so every relative link in a canonical file
resolves identically here. That is deliberate: rewriting links per runtime would create a second place
a link can be wrong.

## How to use it

1. \`/trust\` once — project configuration only loads after trust.
2. \`/reload\` after any \`pnpm harness:generate\`.
3. The slash commands in the \`/\` menu are the workflows. Subagents are dispatched by name.
4. Before committing anything under \`.pi/\`: \`pnpm harness:generate\`, then \`pnpm pi:check\`, then
   \`pnpm check:links\`.

## What is Pi-specific, and why it is here rather than in the source

The adapter, not the canonical source, holds Pi's frontmatter field names, Pi's tool identifiers, the
permission syntax, the dispatch configuration, the package list, and the translation from an abstract
model tier to a runtime thinking level. Those are facts about Pi, and the canonical source is written
so that a second runtime does not mean rewriting nine agents.

See [\`adapters/pi/README.md\`](../harness-core/adapters/pi/README.md) for the full table and the
reason behind each decision.
`,
  );

  return artifacts;
}

// ---------------------------------------------------------------------------------------------
// Write, or compare
// ---------------------------------------------------------------------------------------------

const GENERATED_ROOTS = ['.pi/capabilities', '.pi/workflows', '.pi/rules'];
// Directories a previous layout of this adapter wrote. They are removed rather than migrated: their
// content now lives under GENERATED_ROOTS, and leaving them behind would give the runtime two copies
// of every rule with nothing saying which one it loaded.
const RETIRED_GENERATED_ROOTS = [
  '.pi/agents',
  '.pi/skills',
  '.pi/policies',
  '.pi/config',
];

function currentGeneratedFiles() {
  const files = new Set();
  for (const root of [...GENERATED_ROOTS, ...RETIRED_GENERATED_ROOTS]) {
    for (const file of walk(join(repoRoot, root))) {
      files.add(relative(repoRoot, file));
    }
  }
  for (const extra of ['.pi/settings.json', '.pi/README.md']) {
    if (existsSync(join(repoRoot, extra))) files.add(extra);
  }
  return files;
}

export function diffGenerated() {
  const artifacts = buildArtifacts();
  const drift = [];
  const onDisk = currentGeneratedFiles();

  for (const [rel, content] of artifacts) {
    const full = join(repoRoot, rel);
    if (!existsSync(full)) {
      drift.push(`${rel}: missing — run \`pnpm harness:generate\``);
      continue;
    }
    if (readFileSync(full, 'utf8') !== content) {
      drift.push(`${rel}: stale — run \`pnpm harness:generate\``);
    }
    onDisk.delete(rel);
  }
  for (const stale of [...onDisk].sort()) {
    drift.push(
      `${stale}: generated output for a component that no longer exists`,
    );
  }
  return drift;
}

function main() {
  const artifacts = buildArtifacts();

  if (check) {
    const drift = diffGenerated();
    if (drift.length > 0) {
      console.error(
        'pi adapter: generated output does not match the canonical source.',
      );
      for (const d of drift) console.error(`  ${d}`);
      process.exit(1);
    }
    console.log(
      `pi adapter: ${artifacts.size} generated files match harness-core/`,
    );
    return;
  }

  for (const root of [...GENERATED_ROOTS, ...RETIRED_GENERATED_ROOTS]) {
    rmSync(join(repoRoot, root), { recursive: true, force: true });
  }
  for (const [rel, content] of artifacts) {
    const full = join(repoRoot, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  const retired = RETIRED_GENERATED_ROOTS.filter((root) =>
    existsSync(join(repoRoot, root.split('/')[0])),
  );
  console.log(
    `pi adapter: generated ${artifacts.size} files into .pi/ from harness-core/` +
      (retired.length > 0
        ? `; removed ${RETIRED_GENERATED_ROOTS.length} retired directories`
        : ''),
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  main();
}

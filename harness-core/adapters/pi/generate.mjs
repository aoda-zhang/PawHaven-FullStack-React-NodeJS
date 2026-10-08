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
// This adapter performs a REAL translation, not a mirror. The canonical tree is organised by plugin,
// agent, skill, workflow, and rule; Pi's native layout is agents/, skills/, prompts/, and settings.json.
// The two are deliberately different: a flat agent namespace (plugin__agent) and a Pi skill tree
// (.pi/skills/<plugin>/<skill>) are what the Pi loader expects, and they are not the same shape as the
// canonical tree. Mirroring would have forced Pi's constraints back into canonical source; translating
// keeps canonical runtime-neutral.
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

// Canonical tool vocabulary → Pi tool identifiers.
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
    systemPromptMode: 'replace',
    inheritProjectContext: true,
    defaultContext: 'fresh',
    canDispatch: true,
  },
  scout: {
    inheritProjectContext: true,
    defaultContext: 'fresh',
  },
  architect: {
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
    defaultContext: 'fork',
    runtimeTools: ['watchdog_diff', 'contact_supervisor'],
  },
  'browser-verifier': {
    systemPromptMode: 'replace',
    inheritProjectContext: true,
    defaultContext: 'fresh',
  },
};

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
  // Canonical: plugins/<plugin>/agents/<name>.md
  // Pi:        .pi/agents/<plugin>__<name>.md  (flat, namespaced by plugin)
  const agentFiles = walk(join(harnessCore, 'plugins'))
    .filter((f) => f.endsWith('.md') && f.includes(`${sep}agents${sep}`))
    .sort();

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
    const plugin = rel.split(sep)[1];

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
      join('.pi', 'agents', `${plugin}__${name}.md`),
      `${out.join('\n')}\n${GENERATED_HEADER}\n${content.trimStart()}`,
    );
  }

  // --- skills -------------------------------------------------------------------------------
  // Canonical: plugins/<plugin>/skills/<skill>/**
  // Pi:        .pi/skills/<plugin>/<skill>/**
  const skillDirs = [];
  for (const plugin of readdirSync(join(harnessCore, 'plugins'), {
    withFileTypes: true,
  })) {
    if (!plugin.isDirectory()) continue;
    const skillsDir = join(harnessCore, 'plugins', plugin.name, 'skills');
    if (!existsSync(skillsDir)) continue;
    for (const skill of readdirSync(skillsDir, { withFileTypes: true })) {
      if (skill.isDirectory())
        skillDirs.push({
          plugin: plugin.name,
          skill: skill.name,
          dir: join(skillsDir, skill.name),
        });
    }
  }
  for (const { plugin, skill, dir } of skillDirs.sort((a, b) =>
    `${a.plugin}/${a.skill}`.localeCompare(`${b.plugin}/${b.skill}`),
  )) {
    for (const file of walk(dir).sort()) {
      const rest = relative(dir, file);
      artifacts.set(
        join('.pi', 'skills', plugin, skill, rest),
        readFileSync(file, 'utf8'),
      );
    }
  }

  // --- workflows (as Pi prompts) ------------------------------------------------------------
  // Canonical: workflows/**.md  →  Pi: .pi/prompts/**
  for (const file of walk(join(harnessCore, 'workflows')).sort()) {
    const rest = relative(join(harnessCore, 'workflows'), file);
    artifacts.set(join('.pi', 'prompts', rest), readFileSync(file, 'utf8'));
  }

  // --- rules (translated into Pi-native context) ---------------------------------------------
  // Pi has no native rules directory. The adapter translates each rule into a prompt the runtime can
  // actually load, under .pi/prompts/rules/. They are constraints, surfaced as runtime context, not as
  // a fabricated native directory the runtime would ignore.
  for (const file of walk(join(harnessCore, 'rules')).sort()) {
    const rest = relative(join(harnessCore, 'rules'), file);
    artifacts.set(
      join('.pi', 'prompts', 'rules', rest),
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
    // Pi recurses into each root looking for SKILL.md, so one root per skill tree is correct.
    skills: ['.pi/skills'],
    // Pi's prompt loader scans one directory and does not descend, so every directory holding a
    // workflow (or a translated rule) is named explicitly.
    prompts: ['.pi/prompts', '.pi/prompts/patterns', '.pi/prompts/rules'],
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

| What Pi loads                                       | Generated from                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| \`.pi/agents/<plugin>__<agent>.md\`                  | \`harness-core/plugins/<plugin>/agents/<agent>.md\`                              |
| \`.pi/skills/<plugin>/<skill>/**\`                   | \`harness-core/plugins/<plugin>/skills/<skill>/**\`                              |
| \`.pi/prompts/<workflow>.md\`, \`.pi/prompts/patterns/*.md\` | \`harness-core/workflows/**\`                                                |
| \`.pi/prompts/rules/*.md\`                           | \`harness-core/rules/*.md\`                                                     |
| \`.pi/settings.json\`                               | \`harness-core/config/model-policy.yaml\` + the adapter's translation tables     |

The generated tree is NOT a mirror of the canonical tree. The adapter translates canonical semantics —
plugin/agent/skill/workflow/rule — into Pi's native layout: a flat agent namespace, a Pi skill tree,
and workflow prompts. That is the whole point of an adapter: canonical stays runtime-neutral, and the
Pi specifics live only here.

## How to use it

1. \`/trust\` once — project configuration only loads after trust.
2. \`/reload\` after any \`pnpm harness:generate\`.
3. The slash commands in the \`/\` menu are the workflows (prompts). Subagents are dispatched by name.
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

const GENERATED_ROOTS = ['.pi/agents', '.pi/skills', '.pi/prompts'];
// Directories a previous layout of this adapter wrote. They are removed rather than migrated: their
// content now lives under GENERATED_ROOTS, and leaving them behind would give the runtime two copies
// of every component with nothing saying which one it loaded.
const RETIRED_GENERATED_ROOTS = [
  '.pi/capabilities',
  '.pi/workflows',
  '.pi/rules',
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

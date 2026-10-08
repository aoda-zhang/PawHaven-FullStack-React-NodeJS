// Harness agent projection — the one place `.pi/agents` is written.
//
// Pi discovers subagents only from `.pi/agents/*.md` (project) or `~/.pi/agent/agents/*.md` (user);
// there is no extension API to register agents from an arbitrary external directory. So `.pi/agents`
// is a single-direction projection of the canonical agents:
//
//     harness-core/plugins/<plugin>/agents/<name>.md
//                     |
//                     |  render Pi-native frontmatter (tool mapping, permission boundary, dispatch
//                     |  config) + copy the body verbatim
//                     v
//              .pi/agents/<plugin>__<name>.md
//
// The canonical agents are runtime-neutral. This step maps canonical intent onto Pi's frontmatter
// contract — that mapping is runtime wiring, and it belongs here, never in canonical source. The agent
// *body* (the system prompt) is copied verbatim; only the frontmatter is rendered. `harness-core`
// remains the only source of truth for behaviour and intent; this file never invents behaviour.
//
// The model tier is also the agent's own concern: each canonical agent declares `modelTier` in its
// frontmatter, and model-policy.yaml defines what each tier means. We resolve that to the `thinking`
// level Pi expects and write it into `.pi/settings.json`'s `subagents.agentOverrides` — runtime wiring
// derived from canonical, not a second source of truth.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  discoverAgents,
  resolveAgentTiers,
} from '../../config/model-policy.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const GENERATED_AGENTS = join(repoRoot, '.pi', 'agents');
const SETTINGS_PATH = join(repoRoot, '.pi', 'settings.json');

// --- frontmatter parsing ----------------------------------------------------------------------

// Reads the canonical frontmatter (a small, fixed YAML shape: scalars, folded `>` blocks, and `- ` lists)
// into a plain object keyed in source order. Only the shapes the canonical agents actually use are handled.
function parseFrontmatter(text) {
  const lines = text.split('\n');
  const data = {};
  const order = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    const keyMatch = /^([A-Za-z][\w-]*):/.exec(line);
    if (!keyMatch) {
      i += 1;
      continue;
    }
    const key = keyMatch[1];
    const after = line.slice(keyMatch[0].length).trim();
    if (after === '') {
      // `- ` list
      const items = [];
      i += 1;
      while (i < lines.length && /^\s+- /.test(lines[i])) {
        items.push(lines[i].replace(/^\s+- /, '').trim());
        i += 1;
      }
      data[key] = items;
      order.push(key);
    } else if (
      after === '>' ||
      after === '|' ||
      after === '>-' ||
      after === '|-'
    ) {
      // folded / literal block: collect indented lines
      const block = [];
      i += 1;
      while (
        i < lines.length &&
        (lines[i].startsWith(' ') ||
          lines[i].startsWith('\t') ||
          lines[i].trim() === '')
      ) {
        block.push(lines[i].replace(/^\s+/, ''));
        i += 1;
      }
      data[key] = block.join('\n');
      order.push(key);
    } else {
      data[key] = after;
      order.push(key);
      i += 1;
    }
  }
  return { data, order };
}

// --- rendering --------------------------------------------------------------------------------

const TOOL_MAP = { dispatch: 'subagent' }; // canonical tool name -> Pi tool name

export function renderAgent(canonical, allNames) {
  const { data, order } = parseFrontmatter(canonical);
  const tools = (Array.isArray(data.tools) ? data.tools : []).map(
    (t) => TOOL_MAP[t] ?? t,
  );

  const isWriter = data.authority === 'write';
  const hasWriteTool = tools.includes('edit') || tools.includes('write');
  if (isWriter && !hasWriteTool) tools.push('edit'); // a writer must be able to edit

  const isDispatcher = tools.includes('subagent');

  // Render the Pi frontmatter. Canonical-only intent fields (modelTier, authority) are carried through
  // for traceability; Pi ignores them and reads the rendered wiring below.
  const out = [];
  out.push('---');
  for (const key of order) {
    const val = data[key];
    if (key === 'tools') {
      out.push('tools:');
      for (const t of tools) out.push(`  - ${t}`);
    } else if (Array.isArray(val)) {
      out.push(`${key}:`);
      for (const item of val) out.push(`  - ${item}`);
    } else if (val !== undefined) {
      if (typeof val === 'string' && val.includes('\n')) {
        out.push(`${key}: >`);
        for (const l of val.split('\n')) out.push(`  ${l}`);
      } else {
        out.push(`${key}: ${val}`);
      }
    }
  }

  if (isDispatcher) {
    out.push('allowNestedSubagents: true');
    out.push('maxSubagentDepth: 4');
  }
  if (data.name === 'orchestrator') {
    const others = allNames.filter((n) => n !== 'orchestrator').sort();
    out.push(`allowedAgents: ${others.join(', ')}`);
  }
  if (!isWriter) {
    out.push('permission:');
    out.push('  write: deny');
    out.push('  edit: deny');
  }
  out.push('---');
  return out.join('\n');
}

function main() {
  const { agents: tierOf } = resolveAgentTiers(repoRoot);
  const agents = discoverAgents(repoRoot);

  if (agents.length === 0) {
    throw new Error(
      'No canonical agents discovered under harness-core/plugins/*/agents/.',
    );
  }
  const allNames = agents.map((a) => a.name);

  // Projected agents: remove the previous projection entirely, then write fresh.
  if (existsSync(GENERATED_AGENTS)) {
    rmSync(GENERATED_AGENTS, { recursive: true, force: true });
  }
  mkdirSync(GENERATED_AGENTS, { recursive: true });

  for (const agent of agents) {
    const canonical = readFileSync(agent.filePath, 'utf8');
    const end = canonical.indexOf('\n---', 3);
    const body = end === -1 ? '' : canonical.slice(end + 4);
    const frontmatter = renderAgent(canonical, allNames);
    const target = join(GENERATED_AGENTS, `${agent.plugin}__${agent.name}.md`);
    writeFileSync(target, `${frontmatter}\n${body}`);
  }

  // Runtime wiring derived from canonical: agent -> thinking level.
  const overrides = {};
  for (const agent of agents) {
    overrides[agent.name] = { thinking: tierOf[agent.name].thinking };
  }

  const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
  settings.subagents = settings.subagents || {};
  settings.subagents.agentOverrides = overrides;
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');

  const byName = new Map(agents.map((a) => [a.name, a]));
  const names = [...byName.keys()].sort();
  console.log(
    `pi agent projection: wrote ${agents.length} agent(s) to .pi/agents and ${names.length} thinking override(s) to .pi/settings.json`,
  );
  for (const name of names) {
    const a = byName.get(name);
    console.log(
      `  - ${name} (${a.plugin}) -> ${tierOf[name].tier}/${tierOf[name].thinking}`,
    );
  }
}

// Run only when invoked directly, so the renderer can be imported by the runtime validator without
// re-writing .pi/agents.
if (process.argv[1] === fileURLToPath(import.meta.url)) main();

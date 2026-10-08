// Reads harness-core/config/model-policy.yaml and resolves an agent to its tier.
//
// The parser is deliberately tiny and supports exactly the shape that file is written in: top-level
// `key: value`, one level of nested maps, comma-separated scalars, `[]` for an empty list, `#`
// comments, and blank lines. Anything it does not recognise is a hard error rather than a silent
// default, because a policy that parses to nothing resolves every agent to nothing and the harness
// would then run without the tiering it claims to have.
//
// Model policy has exactly one source of truth for tier intent: each agent declares `modelTier` in
// its own frontmatter (harness-core/plugins/<plugin>/agents/<name>.md). This module reads the tiers
// from model-policy.yaml and resolves every canonical agent's declared tier to a thinking level. It
// never maintains a second agent -> tier map.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const POLICY_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  'model-policy.yaml',
);

const SCALAR = /^[A-Za-z0-9_./, -]+$/;

function parseScalar(raw, where) {
  const value = raw.trim();
  if (value === '') return '';
  if (value === '[]') return [];
  if (value === 'null' || value === '~') return null;
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  if (SCALAR.test(value)) return value;
  throw new Error(
    `model-policy.yaml: ${where}: cannot read \`${value}\`. Use a bare word, a quoted string, or [].`,
  );
}

export function parseModelPolicy(text, label = 'model-policy.yaml') {
  const root = {};
  const stack = [{ indent: -1, map: root, key: '<root>' }];
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    const where = `${label}:${index + 1}`;
    if (/^\s*#/.test(line) || line.trim() === '') return;
    if (line.includes('\t')) {
      throw new Error(`${where}: tab indentation is not supported.`);
    }
    const indent = line.length - line.trimStart().length;
    const body = line.trim();
    const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(body);
    const listItem = /^-\s+(.*)$/.exec(body);
    if (!match && !listItem) {
      throw new Error(`${where}: cannot read \`${body}\`.`);
    }
    if (listItem) {
      throw new Error(
        `${where}: block lists are not supported. Write \`key: []\` or a comma-separated value.`,
      );
    }
    const [, key, rest] = match;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent)
      stack.pop();

    const parent = stack[stack.length - 1];
    if (indent <= parent.indent) {
      throw new Error(`${where}: \`${key}\` is indented under nothing.`);
    }
    if (rest.trim() === '') {
      const map = {};
      parent.map[key] = map;
      stack.push({ indent, map, key });
      return;
    }
    if (parent.map[key] !== undefined) {
      throw new Error(`${where}: duplicate key \`${key}\`.`);
    }
    parent.map[key] = parseScalar(rest, where);
  });

  for (const [name, value] of Object.entries(root)) {
    if (value && typeof value === 'object' && Object.keys(value).length === 0) {
      throw new Error(
        `${label}: \`${name}\` is empty. Delete it or give it a value.`,
      );
    }
  }
  return root;
}

export function loadModelPolicy(
  repoRoot = resolve(POLICY_PATH, '..', '..', '..'),
) {
  return parseModelPolicy(readFileSync(POLICY_PATH, 'utf8'));
}

/**
 * Read the top-level scalar keys `name` and `modelTier` from an agent's frontmatter.
 * Only the two values the policy needs are extracted; the rest of the agent body is left untouched.
 */
function readAgentFrontmatter(filePath) {
  const text = readFileSync(filePath, 'utf8');
  if (!text.startsWith('---')) return {};
  const end = text.indexOf('\n---', 3);
  if (end === -1) return {};
  const block = text.slice(3, end);
  const data = {};
  for (const line of block.split('\n')) {
    const m = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (m && line[0] !== ' ' && line[0] !== '\t') {
      data[m[1]] = m[2].trim();
    }
  }
  return data;
}

/** Discover every canonical agent under harness-core/plugins/<plugin>/agents/*.md. */
export function discoverAgents(repoRoot) {
  const pluginsDir = join(repoRoot, 'harness-core', 'plugins');
  if (!existsSync(pluginsDir)) return [];
  const agents = [];
  for (const plugin of readdirSync(pluginsDir)) {
    const agentDir = join(pluginsDir, plugin, 'agents');
    if (!existsSync(agentDir)) continue;
    for (const file of readdirSync(agentDir)) {
      if (!file.endsWith('.md')) continue;
      const filePath = join(agentDir, file);
      const fm = readAgentFrontmatter(filePath);
      if (!fm.name || !fm.modelTier) continue;
      agents.push({
        plugin,
        name: fm.name,
        modelTier: fm.modelTier,
        filePath,
      });
    }
  }
  return agents;
}

/**
 * Resolve every canonical agent to its tier. The agent's `modelTier` frontmatter is the source of
 * truth; model-policy.yaml only defines what each tier means. Throws when an agent names a tier that
 * does not exist, or a tier carries no thinking level.
 */
export function resolveAgentTiers(repoRoot) {
  const policy = loadModelPolicy(repoRoot);
  const { tiers } = policy;
  if (!tiers || typeof tiers !== 'object') {
    throw new Error('model-policy.yaml: no `tiers:` map.');
  }
  const resolved = {};
  for (const agent of discoverAgents(repoRoot)) {
    const tier = tiers[agent.modelTier];
    if (!tier) {
      throw new Error(
        `agent \`${agent.name}\` declares tier \`${agent.modelTier}\`, which does not exist in model-policy.yaml.`,
      );
    }
    if (typeof tier.thinking !== 'string' || tier.thinking === '') {
      throw new Error(
        `model-policy.yaml: tier \`${agent.modelTier}\` has no \`thinking:\` value.`,
      );
    }
    resolved[agent.name] = {
      tier: agent.modelTier,
      thinking: tier.thinking,
      model: tier.model ?? 'inherit',
      purpose: tier.purpose ?? '',
      fallback: tier.fallback ?? [],
    };
  }
  return { tiers, agents: resolved, raw: policy };
}

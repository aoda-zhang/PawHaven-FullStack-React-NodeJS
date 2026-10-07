// Reads harness-core/config/model-policy.yaml and resolves an agent to its tier.
//
// The parser is deliberately tiny and supports exactly the shape that file is written in: top-level
// `key: value`, one level of nested maps, comma-separated scalars, `[]` for an empty list, `#`
// comments, and blank lines. Anything it does not recognise is a hard error rather than a silent
// default, because a policy that parses to nothing resolves every agent to nothing and the harness
// would then run without the tiering it claims to have.
//
// This module is the single reader of that file. Both the adapters and the validators import it, so
// "what tier does this agent have" has exactly one answer.
import { readFileSync } from 'node:fs';
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
 * Resolve every agent to a concrete tier. Throws when an agent names a tier that does not exist, or a
 * tier carries no thinking level, because either one silently degrades to a default.
 */
export function resolveTiers(repoRoot) {
  const policy = loadModelPolicy(repoRoot);
  const { tiers, agents } = policy;
  if (!tiers || typeof tiers !== 'object') {
    throw new Error('model-policy.yaml: no `tiers:` map.');
  }
  if (!agents || typeof agents !== 'object') {
    throw new Error('model-policy.yaml: no `agents:` map.');
  }
  const resolved = {};
  for (const [agent, tierName] of Object.entries(agents)) {
    const tier = tiers[tierName];
    if (!tier) {
      throw new Error(
        `model-policy.yaml: agent \`${agent}\` names tier \`${tierName}\`, which does not exist.`,
      );
    }
    if (typeof tier.thinking !== 'string' || tier.thinking === '') {
      throw new Error(
        `model-policy.yaml: tier \`${tierName}\` has no \`thinking:\` value.`,
      );
    }
    if (tier.fallback !== undefined && !Array.isArray(tier.fallback)) {
      throw new Error(
        `model-policy.yaml: tier \`${tierName}\` \`fallback:\` must be a list or [].`,
      );
    }
    resolved[agent] = {
      tier: tierName,
      thinking: tier.thinking,
      model: tier.model ?? 'inherit',
      purpose: tier.purpose ?? '',
      fallback: tier.fallback ?? [],
    };
  }
  return { tiers, agents: resolved, raw: policy };
}

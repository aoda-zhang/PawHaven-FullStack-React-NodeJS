// Reads `.pi/config/models.yaml` and resolves a lane to its tier.
//
// The parser is deliberately tiny and supports exactly the shape that file is written in:
// top-level `key: value`, one level of nested maps, `[]` for an empty list, `#` comments,
// and blank lines. Anything it does not recognise is a hard error rather than a silent
// default, because a registry that parses to nothing resolves every lane to nothing and
// the harness would then run without the tiering it claims to have.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// An unquoted scalar may hold word characters, `.`, `/`, `-`, `,`, and spaces — enough for a bare
// word, a `provider/id`, and a comma-separated capability list. Anything else has to be quoted, so a
// value that is not meant to be there fails loudly instead of being read as a string.
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
    `models.yaml: ${where}: cannot read \`${value}\`. Use a bare word, a quoted string, or [].`,
  );
}

export function parseModelRegistry(text, label = 'models.yaml') {
  const root = {};
  const stack = [{ indent: -1, map: root, key: '<root>' }];
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    const where = `${label}:${index + 1}`;
    if (/^\s*#/.test(line) || line.trim() === '') return;
    if (/^\s*$/.test(line)) return;
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
      // A block list is not a shape this registry uses; say so instead of dropping it.
      throw new Error(
        `${where}: block lists are not supported. Write \`key: []\` or a comma-separated value.`,
      );
    }
    const [, key, rest] = match;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
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

export function loadModelRegistry(repoRoot) {
  const path = join(repoRoot, '.pi', 'config', 'models.yaml');
  return parseModelRegistry(
    readFileSync(path, 'utf8'),
    '.pi/config/models.yaml',
  );
}

export function resolveTiers(repoRoot) {
  const registry = loadModelRegistry(repoRoot);
  const tiers = registry.tiers;
  const lanes = registry.lanes;
  if (!tiers || typeof tiers !== 'object') {
    throw new Error('.pi/config/models.yaml: no `tiers:` map.');
  }
  if (!lanes || typeof lanes !== 'object') {
    throw new Error('.pi/config/models.yaml: no `lanes:` map.');
  }
  const resolved = {};
  for (const [lane, tierName] of Object.entries(lanes)) {
    const tier = tiers[tierName];
    if (!tier) {
      throw new Error(
        `.pi/config/models.yaml: lane \`${lane}\` names tier \`${tierName}\`, which does not exist.`,
      );
    }
    const thinking = tier.thinking;
    if (typeof thinking !== 'string' || thinking === '') {
      throw new Error(
        `.pi/config/models.yaml: tier \`${tierName}\` has no \`thinking:\` value.`,
      );
    }
    const fallback = tier.fallback;
    if (fallback !== undefined && !Array.isArray(fallback)) {
      throw new Error(
        `.pi/config/models.yaml: tier \`${tierName}\` \`fallback:\` must be a list or [].`,
      );
    }
    resolved[lane] = {
      tier: tierName,
      thinking,
      model: tier.model ?? 'inherit',
      capability: tier.capability ?? '',
      fallback: fallback ?? [],
    };
  }
  return { tiers, lanes: resolved };
}

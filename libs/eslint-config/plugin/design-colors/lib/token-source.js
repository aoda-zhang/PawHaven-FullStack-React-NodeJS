/**
 * Reads the design-system CSS at lint time, so the list of valid tokens is
 * never written down twice. The CSS is the single source of truth.
 */
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_CSS_FILES = [
  'packages/design-system/src/tokens',
  'packages/design-system/src/theme.css',
  'packages/design-system/src/utilities.css',
];

let repoRoot;

/**
 * The repository root is the directory that holds `pnpm-workspace.yaml`.
 * @param {string} from
 * @returns {string}
 */
function findRepoRoot(from) {
  let dir = from;
  while (!fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
    const parent = path.dirname(dir);
    if (parent === dir)
      throw new Error('design-colors: repository root not found');
    dir = parent;
  }
  return dir;
}

function getRepoRoot() {
  if (!repoRoot) repoRoot = findRepoRoot(__dirname);
  return repoRoot;
}

/**
 * Every `--token-name` declared in a CSS file or directory.
 * @param {string} target absolute path
 * @param {Set<string>} tokens collected into
 */
function collectTokens(target, tokens, utilities) {
  const stat = fs.statSync(target);

  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.css')) continue;
      collectTokens(path.join(target, entry.name), tokens, utilities);
    }
    return;
  }

  const css = fs.readFileSync(target, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of css.matchAll(/(--[\w-]+)\s*:/g)) tokens.add(match[1]);
  for (const match of css.matchAll(/@utility\s+([\w-]+)/g))
    utilities.add(match[1]);
}

const cache = new Map();

/**
 * The token names the plugin validates against, plus any configured path that
 * does not exist.
 * @param {object} context ESLint rule context
 * @returns {{ tokens: Set<string>, utilities: Set<string>, missing: string[] }}
 */
function getTokens(context) {
  const settings = context.settings['design-colors'] || {};
  const files = [
    ...(settings.cssFiles || DEFAULT_CSS_FILES),
    ...(settings.extraCssFiles || []),
  ];
  const key = files.join('|');

  if (!cache.has(key)) {
    const root = getRepoRoot();
    const tokens = new Set();
    const utilities = new Set();
    const missing = [];

    for (const file of files) {
      const target = path.resolve(root, file);
      if (!fs.existsSync(target)) {
        missing.push(file);
        continue;
      }
      collectTokens(target, tokens, utilities);
    }

    cache.set(key, { tokens, utilities, missing });
  }

  return cache.get(key);
}

module.exports = { getTokens };

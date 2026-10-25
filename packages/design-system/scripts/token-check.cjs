#!/usr/bin/env node
// Design-token gate for the CSS token sources.
//
// The class-name rules live in the ESLint plugin
// (@pawhaven/eslint-plugin-design-colors), which reads the same CSS files.
// What is left here is what ESLint cannot see: the CSS itself.
//
// Checks:
//   raw-hex        a colour written down instead of read from a token
//   px-arbitrary   a px value inside an arbitrary value
//   palette-name   a raw Tailwind palette name
//   var-bypass     a design token read through var() inside an arbitrary value
//   comment-drift  a trailing comment that states a colour the token no longer has
//
// Exit 0 = clean, 1 = violation, 2 = input error.
const { existsSync, readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative, resolve, sep } = require('node:path');

const repoRoot = resolve(__dirname, '..', '..', '..');

// The token sources. Every path must exist: a token source that moved is a
// gate that no longer guards anything.
const TOKEN_DIRS = [
  'packages/design-system/src/tokens',
  'packages/design-system/src/theme.css',
  'apps/frontend/portal/src/shared/utils/rescue-status/rescueStatusColors.css',
];

// The file the comment/value drift check reads.
const THEME_SOURCE = 'packages/design-system/src/theme.css';

// CSS files covered by the design-token gate. The PDF stylesheet is included
// explicitly because its generated runtime tokens are synced from this package
// during document-service prebuild; source CSS must not hard-code palette values.
const CSS_DIRS = [
  'packages/design-system',
  'packages/ui',
  'packages/frontend-core',
  'apps/frontend',
  'apps/backend/document-service/src/modules/pdf/engine/index.css',
];

// The primitive palette is the one place a colour may be written down: it is
// the definition every other file reads from.
const PRIMITIVE_DIRS = ['packages/design-system/src/tokens'];

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
]);

const CSS_RULES = [
  {
    id: 'raw-hex',
    pattern: /#[0-9a-fA-F]{3,8}\b/,
    message: 'raw hex colour — read the colour from a design token',
  },
  {
    id: 'px-arbitrary',
    pattern: /-\[[0-9]*\.?[0-9]+px\]/,
    message: 'px in an arbitrary value — use a design token or rem',
  },
  {
    id: 'palette-name',
    pattern:
      /\b(?:text|bg|border|ring|outline|fill|stroke|from|via|to|decoration|placeholder|divide|shadow)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|brown)-\d+\b/,
    message: 'raw Tailwind palette name — use a semantic token',
  },
  {
    id: 'arbitrary-hex-color',
    pattern: /\b(?:text|bg|border|ring|outline|shadow|fill|stroke|from|via|to)-\[#[0-9a-fA-F]{3,8}\]/,
    message: 'arbitrary hex colour — use a semantic design token',
  },
  {
    id: 'raw-radius',
    pattern: /\brounded-(?:xs|sm|md|lg|xl|2xl|3xl)(?:\/\d+)?\b/,
    message: 'raw radius utility — use the approved radius token',
  },
  {
    id: 'arbitrary-radius',
    pattern: /\brounded-\[[^\]]+\]/,
    message: 'arbitrary radius — use the approved radius token',
  },
  {
    id: 'var-bypass',
    pattern:
      /(bg|text|border|ring|outline|shadow|accent|caret|fill|stroke|placeholder|decoration)-\[var\(--color-/,
    message:
      'CSS-variable bypass — use the design token utility class directly',
  },
];

const failures = [];

function fail(file, line, ruleId, message) {
  failures.push({ file, line, ruleId, message });
}

// ── Sources ──────────────────────────────────────────────────

// Every CSS file behind one configured path, or null when the path is gone.
function collectCssFiles(target) {
  const absolute = join(repoRoot, target);
  if (!existsSync(absolute)) return null;
  if (statSync(absolute).isFile()) {
    return absolute.endsWith('.css') ? [absolute] : [];
  }
  const found = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const child = join(absolute, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectCssFiles(relative(repoRoot, child)));
    } else if (entry.name.endsWith('.css')) {
      found.push(child);
    }
  }
  return found;
}

// The comments are replaced by spaces, so the line numbers of the code that
// follows them stay the same.
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.replace(/[^\n]/g, ' '),
  );
}

function isPrimitive(file) {
  const path = file.split(sep).join('/');
  return PRIMITIVE_DIRS.some((dir) => path.startsWith(`${dir}/`));
}

// ── Token values ─────────────────────────────────────────────

const tokenValues = new Map();

// The colour a token resolves to, or null when it does not resolve to one.
function resolveHex(name, seen = new Set()) {
  if (seen.has(name)) return null;
  seen.add(name);
  const value = tokenValues.get(name);
  if (value === undefined) return null;
  const reference = /^var\(\s*(--[\w-]+)\s*\)$/.exec(value);
  if (reference) return resolveHex(reference[1], seen);
  const hex = /^#([0-9a-fA-F]{3,8})$/.exec(value);
  return hex ? `#${hex[1].toLowerCase()}` : null;
}

// ── The checks ───────────────────────────────────────────────

// A trailing comment that states a hex must state the hex the token has.
function checkCommentDrift(file) {
  const css = readFileSync(file, 'utf8');
  const declarations = /(--[\w-]+)\s*:\s*([^;]*);[ \t]*\/\*([\s\S]*?)\*\//g;
  for (const match of css.matchAll(declarations)) {
    const [, name, , comment] = match;
    const stated = comment.match(/#[0-9a-fA-F]{3,8}\b/);
    if (!stated) continue;
    const resolved = resolveHex(name);
    if (resolved === null) {
      fail(
        relative(repoRoot, file),
        lineOf(css, match.index),
        'comment-drift',
        `comment states ${stated[0]} but ${name} does not resolve to a colour`,
      );
      continue;
    }
    if (resolved !== stated[0].toLowerCase()) {
      fail(
        relative(repoRoot, file),
        lineOf(css, match.index),
        'comment-drift',
        `comment states ${stated[0]} but ${name} is ${resolved}`,
      );
    }
  }
}

function lineOf(css, offset) {
  let line = 1;
  for (let i = 0; i < offset; i++) {
    if (css[i] === '\n') line++;
  }
  return line;
}

// ── Run ──────────────────────────────────────────────────────

const tokenFiles = [];
for (const dir of TOKEN_DIRS) {
  const files = collectCssFiles(dir);
  if (files === null) {
    console.error(`token-check: token source not found: ${dir}`);
    process.exit(2);
  }
  tokenFiles.push(...files);
}

for (const file of tokenFiles) {
  const css = readFileSync(file, 'utf8');
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokenValues.set(match[1], match[2].replace(/\s+/g, ' ').trim());
  }
}

let filesScanned = 0;
for (const dir of CSS_DIRS) {
  const files = collectCssFiles(dir);
  if (files === null) {
    console.error(`token-check: CSS directory not found: ${dir}`);
    process.exit(2);
  }
  for (const file of files) {
    filesScanned++;
    const rel = relative(repoRoot, file);
    const code = stripComments(readFileSync(file, 'utf8'));
    const lines = code.split('\n');
    for (const rule of CSS_RULES) {
      if (rule.id === 'raw-hex' && isPrimitive(rel)) continue;
      lines.forEach((text, index) => {
        if (rule.pattern.test(text)) {
          fail(rel, index + 1, rule.id, rule.message);
        }
      });
    }
  }
}


// Source-code counterpart of the CSS token gate. This replaces the former
// check-design-token-usage.mjs so all design-token enforcement has one entry point.
const SOURCE_SCOPES = [
  'packages/design-system/src',
  'packages/ui/src',
  'packages/frontend-core/src',
  'apps/frontend/portal/src',
  'apps/backend/document-service/src/modules/pdf',
];
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const SOURCE_RULES = [
  {
    id: 'raw-hex',
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    message: 'raw hex colour — read the colour from a design token',
  },
  {
    id: 'raw-palette',
    pattern: /\b(?:text|bg|border|ring|outline|fill|stroke|from|via|to|decoration|placeholder|divide|shadow)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|brown)-\d+\b/g,
    message: 'raw Tailwind palette name — use a semantic token',
  },
  {
    id: 'arbitrary-hex-color',
    pattern: /\b(?:text|bg|border|ring|outline|shadow|fill|stroke|from|via|to)-\[#[0-9a-fA-F]{3,8}\]/g,
    message: 'arbitrary hex colour — use a semantic design token',
  },
  {
    id: 'raw-radius',
    pattern: /\brounded-(?:xs|sm|md|lg|xl|2xl|3xl)(?:\/\d+)?\b/g,
    message: 'raw radius utility — use the approved radius token',
  },
  {
    id: 'arbitrary-radius',
    pattern: /\brounded-\[[^\]]+\]/g,
    message: 'arbitrary radius — use the approved radius token',
  },
];

function collectSourceFiles(target) {
  const absolute = join(repoRoot, target);
  if (!existsSync(absolute)) return null;
  if (statSync(absolute).isFile()) {
    const extension = absolute.slice(absolute.lastIndexOf('.'));
    return SOURCE_EXTENSIONS.has(extension) ? [absolute] : [];
  }
  const found = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const child = join(absolute, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectSourceFiles(relative(repoRoot, child)));
    } else {
      const extension = entry.name.slice(entry.name.lastIndexOf('.'));
      if (SOURCE_EXTENSIONS.has(extension)) found.push(child);
    }
  }
  return found;
}

let sourceFilesScanned = 0;
for (const scope of SOURCE_SCOPES) {
  const files = collectSourceFiles(scope);
  if (files === null) {
    console.error('token-check: source scope not found: ' + scope);
    process.exit(2);
  }
  for (const file of files) {
    sourceFilesScanned++;
    const rel = relative(repoRoot, file).split(sep).join('/');
    const original = readFileSync(file, 'utf8');
    const code = original
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      for (const rule of SOURCE_RULES) {
        if (rule.id === 'raw-hex' && rel.startsWith('packages/design-system/src/tokens/')) continue;
        rule.pattern.lastIndex = 0;
        for (const match of line.matchAll(rule.pattern)) {
          fail(rel, index + 1, rule.id, rule.message + ' (' + match[0] + ')');
        }
      }
    });
  }
}

checkCommentDrift(join(repoRoot, THEME_SOURCE));

console.log(
  `token-check: ${filesScanned} CSS files and ${sourceFilesScanned} source files scanned, ${tokenValues.size} tokens loaded`,
);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(
      `fail  ${failure.file}:${failure.line}  ${failure.ruleId}: ${failure.message}`,
    );
  }
  process.exit(1);
}

console.log('token-check: OK');

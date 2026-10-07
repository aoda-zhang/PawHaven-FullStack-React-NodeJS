#!/usr/bin/env node
// Runs the checks a review needs that a command can decide, and prints each result as a finding with
// a severity, a location, and the command that produced it.
//
// This file executes rules. It does not own any: every check below names the reference whose rule it
// runs, so the rule text has exactly one owner and this script stays a list of commands. Adding
// project architecture here would create a second rule system nobody reads.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const repoRoot = resolve(value('root', process.cwd()));
const base = value('base', null);
const skip = new Set(
  (value('skip', '') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);
// --offline withholds every check that reaches the network, and reports each one as NOT RUN rather
// than letting it fail as if the code were wrong.
const offline = flag('offline');
const json = flag('json');

const REACT_DOCTOR_VERSION = '0.9.12';

const findings = [];
const notRun = [];
const notes = [];

function record({ id, severity, check, file, line, message, evidence, rule }) {
  findings.push({ id, severity, check, file, line, message, evidence, rule });
}

function sh(command, commandArgs, { timeout = 600000 } = {}) {
  const r = spawnSync(command, commandArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

// --- discovery -------------------------------------------------------------------------------

const frontendSrc = 'apps/frontend/portal/src';
const frontendExists = existsSync(join(repoRoot, frontendSrc));

function diffTargets() {
  if (!base) return null;
  try {
    const out = execFileSync(
      'git',
      ['--no-pager', 'diff', '--name-only', base],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    );
    const tracked = out.split('\n').filter(Boolean);
    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => l.slice(3).trim());
    return [...new Set([...tracked, ...status])].filter((f) =>
      /\.(ts|tsx)$/.test(f),
    );
  } catch {
    return null;
  }
}

// --- deterministic checks --------------------------------------------------------------------
//
// `rule` names the reference that owns the rule. `severity` is the review severity from
// references/review-protocol.md. Neither is defined anywhere else.

const greps = [
  {
    id: 'FE-STATE-SERVER-DATA',
    severity: 'BLOCKING',
    rule: 'references/frontend.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        'state\\.\\w*(Response|List|Data)',
        frontendSrc,
        '--glob',
        '*.ts',
        '--glob',
        '*.tsx',
      ]),
    message: 'server data in the Redux slice',
  },
  {
    id: 'FE-STATE-RAW-HOOKS',
    severity: 'BLOCKING',
    rule: 'references/frontend.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        'useSelector|useDispatch',
        frontendSrc,
        '--glob',
        '*.ts',
        '--glob',
        '*.tsx',
        '--glob',
        '!**/reduxHooks.ts',
      ]),
    message: 'raw useSelector/useDispatch outside the typed hooks file',
  },
  {
    id: 'FE-QUERY-RAW-KEY',
    severity: 'BLOCKING',
    rule: 'references/frontend.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        'queryKey.*\\[[^\\]]*[\'"]',
        frontendSrc,
        '--glob',
        '*.ts',
        '--glob',
        '*.tsx',
      ]),
    message: 'raw string query key instead of the key factory',
  },
  {
    id: 'FE-FORM-USESTATE',
    severity: 'BLOCKING',
    rule: 'references/frontend.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        'useState.*(form|input|value)',
        frontendSrc,
        '--glob',
        '*.tsx',
      ]),
    message: 'field state in useState instead of the form library',
  },
  {
    id: 'FE-CONSOLE',
    severity: 'BLOCKING',
    rule: 'references/frontend.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        'console\\.log',
        frontendSrc,
        '--glob',
        '*.ts',
        '--glob',
        '*.tsx',
        '--glob',
        '!*.test.*',
        '--glob',
        '!*.spec.*',
      ]),
    message: 'debug logging in frontend source',
  },
  {
    id: 'FE-STYLE-HEX',
    severity: 'BLOCKING',
    rule: 'references/frontend.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        '#[0-9a-fA-F]{3,8}',
        frontendSrc,
        '--glob',
        '*.tsx',
        '--glob',
        '*.css',
      ]),
    message: 'hardcoded hex colour instead of a design token',
  },
  {
    id: 'FE-STYLE-CSS-VAR',
    severity: 'BLOCKING',
    rule: 'references/frontend.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        '(bg|text|border|ring|outline|shadow|accent|caret|fill|stroke|placeholder|decoration)-\\[var\\(--color-',
        frontendSrc,
        '--glob',
        '*.tsx',
      ]),
    message: 'CSS variable bypass inside a Tailwind arbitrary value',
  },
  {
    id: 'FE-STYLE-INLINE',
    severity: 'BLOCKING',
    rule: 'references/frontend.md',
    applies: () => frontendExists,
    run: () => sh('rg', ['-n', 'style=\\{\\{', frontendSrc, '--glob', '*.tsx']),
    message:
      'inline style attribute — judge whether the value is runtime-computed',
  },
  {
    id: 'FE-STYLE-PALETTE',
    severity: 'MINOR',
    rule: 'references/frontend.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        '(text|bg|border)-(red|blue|green|yellow|orange|gray|brown)-[0-9]+',
        frontendSrc,
        '--glob',
        '*.tsx',
      ]),
    message: 'raw palette colour instead of a semantic token',
  },
  {
    id: 'FE-STYLE-MAGIC-PX',
    severity: 'MINOR',
    rule: 'references/frontend.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        '(w|h|mt|mb|ml|mr|pt|pb|pl|pr|p|m|left|right|top|bottom|gap)-\\[[0-9]+px\\]',
        frontendSrc,
        '--glob',
        '*.tsx',
      ]),
    message: 'arbitrary pixel value instead of the spacing scale',
  },
  {
    id: 'BE-CONSOLE',
    severity: 'BLOCKING',
    rule: 'references/backend.md',
    applies: () => existsSync(join(repoRoot, 'apps/backend')),
    run: () =>
      sh('rg', [
        '-n',
        'console\\.log',
        'apps/backend',
        '--glob',
        '*.ts',
        '--glob',
        '!**/node_modules/**',
        '--glob',
        '!**/dist/**',
        '--glob',
        '!**/*.test.ts',
        '--glob',
        '!**/*.spec.ts',
      ]),
    message: 'debug logging in backend source — not enforced by the linter',
  },
  {
    id: 'BE-ANY',
    severity: 'BLOCKING',
    rule: 'references/backend.md',
    applies: () => existsSync(join(repoRoot, 'apps/backend')),
    run: () =>
      sh('rg', [
        '-n',
        ': any\\b|<any>',
        'apps/backend',
        '--glob',
        '*.ts',
        '--glob',
        '!**/node_modules/**',
        '--glob',
        '!**/dist/**',
        '--glob',
        '!**/*.test.ts',
        '--glob',
        '!**/*.spec.ts',
      ]),
    message:
      'any in backend source — the linter reports this as a warning only',
  },
  {
    id: 'ARCH-UI-INVERSION',
    severity: 'BLOCKING',
    rule: 'references/architecture.md',
    applies: () => existsSync(join(repoRoot, 'packages/ui')),
    run: () =>
      sh('rg', [
        '-n',
        "from '@pawhaven/frontend-core'",
        'packages/ui',
        '--glob',
        '*.ts',
        '--glob',
        '*.tsx',
      ]),
    message: 'ui importing frontend-core inverts the dependency direction',
  },
  {
    id: 'ARCH-PACKAGE-FEATURE',
    severity: 'BLOCKING',
    rule: 'references/architecture.md',
    applies: () => existsSync(join(repoRoot, 'packages')),
    run: () =>
      sh('rg', [
        '-n',
        "from '.*features/",
        'packages',
        '--glob',
        '*.ts',
        '--glob',
        '*.tsx',
      ]),
    message: 'a shared package importing app feature code',
  },
  {
    id: 'ARCH-BACKEND-FRONTEND-PKG',
    severity: 'BLOCKING',
    rule: 'references/architecture.md',
    applies: () => existsSync(join(repoRoot, 'apps/backend')),
    run: () =>
      sh('rg', [
        '-n',
        '@pawhaven/(frontend-core|ui|design-system)',
        'apps/backend',
        '--glob',
        '*.ts',
        '--glob',
        '!**/node_modules/**',
      ]),
    message:
      'backend code importing a frontend package — the shared contract is in the wrong place',
  },
  {
    id: 'ARCH-MODULE-ISOLATION',
    severity: 'BLOCKING',
    rule: 'references/architecture.md',
    applies: () => existsSync(join(repoRoot, 'apps/backend/core-service/src')),
    run: () =>
      sh('rg', [
        '-n',
        "from '@modules/|from '\\.\\./.*/modules/",
        'apps/backend/core-service/src',
        '--glob',
        '*.ts',
        '--glob',
        '!**/*.test.ts',
        '--glob',
        '!**/app.module.ts',
      ]),
    message: 'a backend module reaching another module internals',
  },
  {
    id: 'ARCH-I18N-INFRA',
    severity: 'BLOCKING',
    rule: 'references/architecture.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        "from '@pawhaven/i18n'",
        frontendSrc,
        '--glob',
        '*.ts',
        '--glob',
        '*.tsx',
      ]),
    message: 'feature code importing the i18n runtime package directly',
  },
  {
    id: 'ARCH-RAW-NAVIGATION',
    severity: 'BLOCKING',
    rule: 'references/architecture.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        'window\\.history\\.(pushState|replaceState|back|forward)|window\\.location\\.(href|assign|replace)|window\\.location\\s*=',
        frontendSrc,
        '--glob',
        '*.ts',
        '--glob',
        '*.tsx',
      ]),
    message:
      'internal navigation bypassing the router — two files are named exceptions',
  },
  {
    id: 'I18N-CAMEL-KEY',
    severity: 'MINOR',
    rule: 'references/frontend.md',
    applies: () => frontendExists,
    run: () =>
      sh('rg', [
        '-n',
        't\\([\'"][\\w]+\\.[\\w]*[a-z][A-Z][\\w]*[\'"]',
        frontendSrc,
        '--glob',
        '*.ts',
        '--glob',
        '*.tsx',
        '--glob',
        '!**/*.test.tsx',
      ]),
    message: 'camelCase segment in a translation key',
  },
];

const projectChecks = [
  {
    id: 'TS-TYPECHECK',
    severity: 'BLOCKING',
    rule: 'references/typescript.md',
    slow: true,
    applies: () => true,
    run: () => sh('pnpm', ['typecheck']),
    message: 'the tree does not typecheck',
    judge: (r) => r.code !== 0,
  },
  {
    id: 'FE-REACT-DOCTOR',
    severity: 'BLOCKING',
    rule: 'references/frontend.md',
    slow: true,
    network: true,
    applies: () => frontendExists,
    run: () =>
      sh(
        'npx',
        [
          `react-doctor@${REACT_DOCTOR_VERSION}`,
          '-y',
          '--verbose',
          '--scope',
          'changed',
          '--include-untracked',
        ],
        { timeout: 900000 },
      ),
    message: 'the React gate reported an issue',
  },
  {
    id: 'I18N-LOCALE-PARITY',
    severity: 'BLOCKING',
    rule: 'references/frontend.md',
    applies: () => existsSync(join(repoRoot, 'packages/i18n/locales')),
    run: () =>
      sh('node', [
        'harness-core/capabilities/frontend-development/skills/frontend-patterns/scripts/check-locale-parity.mjs',
        '--locales',
        'packages/i18n/locales',
        '--reference',
        'en-US',
      ]),
    message: 'locale key parity drift',
  },
  {
    id: 'FMT-PRETTIER',
    severity: 'MINOR',
    rule: 'references/frontend.md',
    slow: true,
    applies: () => true,
    run: () =>
      sh('npx', [
        'prettier',
        '--check',
        'apps/**/*.{ts,tsx}',
        'packages/**/*.{ts,tsx}',
      ]),
    message: 'format drift',
  },
];

// --- execution -------------------------------------------------------------------------------

const targets = diffTargets();

for (const check of greps) {
  if (skip.has(check.id)) {
    notRun.push({ id: check.id, reason: 'skipped on request' });
    continue;
  }
  if (!check.applies()) {
    notRun.push({ id: check.id, reason: 'does not apply to this scope' });
    continue;
  }
  const r = check.run();
  if (r.code === 127) {
    notRun.push({
      id: check.id,
      reason: 'rg is not installed on this machine',
    });
    continue;
  }
  // ripgrep exits 1 for "no matches", which is the pass case, and 2 for an error.
  if (r.code === 1) continue;
  if (r.code !== 0 && r.code !== 2) {
    notRun.push({ id: check.id, reason: `command exited ${r.code}` });
    continue;
  }
  for (const line of r.out.split('\n')) {
    if (line.trim() === '') continue;
    const m = /^(.+?):(\d+):(.*)$/.exec(line);
    if (!m) continue;
    record({
      id: check.id,
      severity: check.severity,
      check: 'project check',
      file: m[1],
      line: Number(m[2]),
      message: check.message,
      evidence: line.trim(),
      rule: check.rule,
    });
  }
}

for (const check of projectChecks) {
  if (skip.has(check.id)) {
    notRun.push({ id: check.id, reason: 'skipped on request' });
    continue;
  }
  if (!check.applies()) {
    notRun.push({ id: check.id, reason: 'does not apply to this scope' });
    continue;
  }
  if (offline && check.network) {
    notRun.push({
      id: check.id,
      reason: 'offline: the check reaches the network',
    });
    continue;
  }
  const r = check.run();
  const failed = check.judge ? check.judge(r) : r.code !== 0;
  if (!failed) continue;
  if (r.code === 127) {
    notRun.push({
      id: check.id,
      reason: 'the command is not installed on this machine',
    });
    continue;
  }
  record({
    id: check.id,
    severity: check.severity,
    check: 'project check',
    file: null,
    line: null,
    message: check.message,
    evidence: r.out.split('\n').slice(0, 40).join('\n'),
    rule: check.rule,
  });
}

if (targets && targets.length === 0) {
  notes.push(
    'no changed .ts/.tsx files resolved; per-file type rules were not narrowed to a diff',
  );
}

const blocking = findings.filter((f) => f.severity === 'BLOCKING').length;

if (json) {
  console.log(JSON.stringify({ findings, notRun, notes, blocking }, null, 2));
} else {
  console.log(
    `deterministic checks: ${findings.length} findings (${blocking} blocking), ${notRun.length} not run`,
  );
  for (const f of findings) {
    console.log(
      `  ${f.severity.padEnd(10)} ${f.id} ${f.file ? `${f.file}:${f.line}` : ''} — ${f.message}`,
    );
  }
  for (const n of notRun) console.log(`  NOT RUN    ${n.id} — ${n.reason}`);
  for (const n of notes) console.log(`  NOTE       ${n}`);
  console.log('');
  console.log(
    'Each hit is a candidate. Open the line and judge it — the rule and its exclusions are',
  );
  console.log(
    'named by the `rule` field above, in the reference it points at.',
  );
}

process.exit(blocking > 0 ? 1 : 0);

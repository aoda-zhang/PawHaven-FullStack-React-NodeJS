/* eslint-disable no-magic-numbers */

export const DEFAULT_TTLS = Object.freeze({
  commitMinutes: 30,
});

export const MAX_TTLS = Object.freeze({
  commitMinutes: 120,
});

const MIN_TTL_MINUTES = 1;
const MAX_NOTE_LENGTH = 200;
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const MINUTES_PER_HOUR = 60;
const GIT_DIR = '.git';

export const MESSAGES = Object.freeze({
  editOutsideProject:
    'flow-gate: this edit resolves outside the project root, so no agent may make it. Ask the human to make this change themselves instead of dispatching the implementer. Do not retry this edit and do not work around this with shell or any other write path.',
  editInGitDir:
    'flow-gate: files under .git/ are never editable by an agent. Ask the human to make this change themselves instead of dispatching the implementer. Do not retry this edit and do not work around this with shell or any other write path.',
  commitRequired:
    'flow-gate: no active /approve-commit grant. Publishing git history needs an approved commit. Ask the human to run /approve-commit. Do not retry this command and do not work around this with shell or any other git path.',
  commitExpired:
    'flow-gate: the /approve-commit grant has expired. Ask the human to run /approve-commit again. Do not retry this command and do not work around this with shell or any other git path.',
  destructive:
    'flow-gate: destructive git history or worktree operations are never permitted for agents, and /approve-commit does not change that. Ask the human to run this command themselves. Do not retry this command and do not work around this with shell.',
  dangerousFlag:
    'flow-gate: git flags that redirect configuration, hooks, output, or the repository location are never permitted, and /approve-commit does not change that. Ask the human to run this command themselves. Do not retry this command and do not work around this with shell.',
  nestedRuntime:
    'flow-gate: starting or controlling another OpenCode runtime from inside a session is never permitted. Ask the human to run opencode themselves. Do not retry this command and do not work around this with shell.',
  gitDirWrite:
    'flow-gate: writing into .git/ from the shell is never permitted, and /approve-commit does not change that. Ask the human to make this change themselves. Do not retry this command and do not work around this with shell.',
  unknownGitVerb:
    'flow-gate: this git verb is neither read-only nor an approved publishing command, so it is denied. Ask the human to run the command themselves. Do not retry this command and do not work around this with shell.',
});

const USAGE =
  '/approve-commit [<ttl>] [<note...>] | /approve-commit revoke | /approve-commit status';

const WHOLE_DURATION = /^(\d+)([mh]?)$/;
const DURATION_SHAPE = /^\d+(\.\d+)?[mh]?$/;
const UNBOUNDED_NOTES = new Set(['*', 'all', 'any', 'everything']);
const LIMITS = Object.freeze({ max: MAX_TTLS.commitMinutes, usage: USAGE });

function normalizePath(input) {
  const withSlashes = String(input ?? '')
    .trim()
    .replace(/\\/g, '/');
  const driveMatch = /^([A-Za-z]:)\//.exec(withSlashes);
  const drive = driveMatch ? `${driveMatch[1]}/` : '';
  const absolute = drive !== '' || withSlashes.startsWith('/');
  const body = drive ? withSlashes.slice(drive.length) : withSlashes;
  const resolved = [];
  body.split('/').forEach((segment) => {
    if (segment === '' || segment === '.') {
      return;
    }
    if (segment === '..') {
      if (resolved.length > 0) {
        resolved.pop();
      } else if (!absolute) {
        resolved.push('..');
      }
      return;
    }
    resolved.push(segment);
  });
  return `${absolute ? drive || '/' : ''}${resolved.join('/')}`;
}

function isAbsolutePath(value) {
  return value.startsWith('/') || /^[A-Za-z]:\//.test(value);
}

function resolveResourcePath(resource, projectRoot) {
  const normalizedResource = normalizePath(resource);
  if (isAbsolutePath(normalizedResource)) {
    return normalizedResource;
  }
  return normalizePath(`${projectRoot}/${normalizedResource}`);
}

function relativeToRoot(resource, projectRoot) {
  const root = normalizePath(projectRoot);
  if (root === '') {
    return null;
  }
  const resolved = resolveResourcePath(resource, root);
  if (resolved === root) {
    return '';
  }
  const prefix = root.endsWith('/') ? root : `${root}/`;
  if (!resolved.startsWith(prefix)) {
    return null;
  }
  return resolved.slice(prefix.length);
}

function isGitDirPath(relative) {
  return relative.split('/').includes(GIT_DIR);
}

function classifyEditResource(resource, projectRoot) {
  const relative = relativeToRoot(resource, projectRoot);
  if (relative === null) {
    return 'outside';
  }
  return isGitDirPath(relative) ? 'git-dir' : 'project';
}

export function grantStatus(grant, now) {
  if (!grant || !Number.isFinite(grant.expiresAt)) {
    return { active: false };
  }
  return { active: now < grant.expiresAt, expiresAt: grant.expiresAt };
}

function deny(message) {
  return { effect: 'deny', message };
}

function evaluateEdits(resourceList, projectRoot) {
  if (resourceList.length === 0) {
    return { effect: 'pass' };
  }
  const blocked = resourceList
    .map((resource) => classifyEditResource(resource, projectRoot))
    .find((kind) => kind !== 'project');
  if (blocked === 'outside') {
    return deny(MESSAGES.editOutsideProject);
  }
  if (blocked === 'git-dir') {
    return deny(MESSAGES.editInGitDir);
  }
  return { effect: 'pass' };
}

const SHELL_SEPARATORS = new Set([';', '&&', '||', '|', '&', '&>', '\n']);
const RUNNER_PREFIXES = new Set([
  '-c',
  '-lc',
  '-ic',
  '-ec',
  '--yes',
  '-y',
  'xargs',
  'time',
  'command',
  'nohup',
  'env',
  'sudo',
  'eval',
  'exec',
  'watch',
  'npx',
  'pnpx',
  'pnpm',
  'dlx',
]);
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
const REDIRECT = /^(?:[0-9]?>>?|&>)/;
const READONLY_VERBS = new Set([
  'status',
  'diff',
  'log',
  'show',
  'rev-parse',
  'ls-files',
  'blame',
  'describe',
]);
const PUBLISH_VERBS = new Set(['add', 'commit', 'push', 'tag', 'merge']);
const GH_PUBLISH_SUBCOMMANDS = new Set(['create', 'merge', 'edit']);
const DESTRUCTIVE_VERBS = new Set([
  'reset',
  'rebase',
  'revert',
  'cherry-pick',
  'clean',
  'restore',
  'update-ref',
  'filter-branch',
  'reflog',
  'checkout',
]);
const BRANCH_DESTRUCTIVE_ARGS = new Set([
  '-d',
  '-D',
  '-m',
  '-M',
  '-c',
  '-C',
  '--delete',
  '--move',
  '--copy',
]);
const STASH_DESTRUCTIVE_SUBCOMMANDS = new Set(['drop', 'clear', 'pop']);
const DESTRUCTIVE_COMMANDS = new Set(['rm', 'mv']);
const GIT_DIR_WRITE_COMMANDS = new Set(['tee', 'cp', 'install']);
const NESTED_RUNTIME_VERBS = new Set(['run', 'serve', 'service', 'plugin']);
const OPTIONS_WITH_VALUE = new Set([
  '-C',
  '--exec-path',
  '--namespace',
  '--config-env',
  '-c',
]);

const READONLY_FINDING = Object.freeze({ kind: 'readonly' });
const PUBLISH_FINDING = Object.freeze({ kind: 'publish' });
const DESTRUCTIVE_FINDING = Object.freeze({
  kind: 'deny',
  message: MESSAGES.destructive,
});
const DANGEROUS_FLAG_FINDING = Object.freeze({
  kind: 'deny',
  message: MESSAGES.dangerousFlag,
});
const UNKNOWN_VERB_FINDING = Object.freeze({
  kind: 'deny',
  message: MESSAGES.unknownGitVerb,
});
const NESTED_RUNTIME_FINDING = Object.freeze({
  kind: 'deny',
  message: MESSAGES.nestedRuntime,
});
const GIT_DIR_WRITE_FINDING = Object.freeze({
  kind: 'deny',
  message: MESSAGES.gitDirWrite,
});

function tokenizeCommand(command) {
  return String(command ?? '')
    .replace(/["']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function isRunnablePosition(tokens, index) {
  if (index === 0) {
    return true;
  }
  const previous = tokens[index - 1];
  return (
    SHELL_SEPARATORS.has(previous) ||
    RUNNER_PREFIXES.has(previous) ||
    ASSIGNMENT.test(previous)
  );
}

function isGitToken(token) {
  return token === 'git' || token.endsWith('/git');
}

function sliceSegment(tokens, startIndex) {
  const segment = [];
  let index = startIndex;
  while (index < tokens.length) {
    if (SHELL_SEPARATORS.has(tokens[index])) {
      return segment;
    }
    segment.push(tokens[index]);
    index += 1;
  }
  return segment;
}

function findVerbIndex(segment) {
  let index = 0;
  while (index < segment.length) {
    const token = segment[index];
    if (!token.startsWith('-')) {
      return index;
    }
    index += OPTIONS_WITH_VALUE.has(token) ? 2 : 1;
  }
  return -1;
}

function findDangerousFlag(segment) {
  const verbIndex = findVerbIndex(segment);
  const beforeVerb = verbIndex === -1 ? segment : segment.slice(0, verbIndex);
  const repositoryRedirect = beforeVerb.some(
    (token) =>
      token === '-c' ||
      token.startsWith('--git-dir') ||
      token.startsWith('--work-tree'),
  );
  if (repositoryRedirect) {
    return true;
  }
  return segment.some(
    (token) =>
      token === '--ext-diff' ||
      token === '--no-verify' ||
      token === '--output' ||
      token.startsWith('--output='),
  );
}

function classifyBranch(args) {
  const destructive = args.some((arg) => BRANCH_DESTRUCTIVE_ARGS.has(arg));
  if (destructive) {
    return [DESTRUCTIVE_FINDING];
  }
  const creates = args.some((arg) => !arg.startsWith('-'));
  return creates ? [PUBLISH_FINDING] : [READONLY_FINDING];
}

function classifyStash(args) {
  const subcommand = args.find((arg) => !arg.startsWith('-'));
  if (STASH_DESTRUCTIVE_SUBCOMMANDS.has(subcommand)) {
    return [DESTRUCTIVE_FINDING];
  }
  return [UNKNOWN_VERB_FINDING];
}

function classifyGitSegment(tokens, gitIndex) {
  const segment = sliceSegment(tokens, gitIndex + 1);
  if (findDangerousFlag(segment)) {
    return [DANGEROUS_FLAG_FINDING];
  }
  const verbIndex = findVerbIndex(segment);
  if (verbIndex === -1) {
    return [UNKNOWN_VERB_FINDING];
  }
  const verb = segment[verbIndex];
  const args = segment.slice(verbIndex + 1);
  if (READONLY_VERBS.has(verb)) {
    return [READONLY_FINDING];
  }
  if (verb === 'branch') {
    return classifyBranch(args);
  }
  if (verb === 'stash') {
    return classifyStash(args);
  }
  if (PUBLISH_VERBS.has(verb)) {
    return [PUBLISH_FINDING];
  }
  if (DESTRUCTIVE_VERBS.has(verb)) {
    return [DESTRUCTIVE_FINDING];
  }
  return [UNKNOWN_VERB_FINDING];
}

function isGitTarget(token) {
  if (!token) {
    return false;
  }
  return normalizePath(token).split('/').includes(GIT_DIR);
}

function classifyGhSegment(tokens, index) {
  if (tokens[index + 1] !== 'pr') {
    return null;
  }
  return GH_PUBLISH_SUBCOMMANDS.has(tokens[index + 2]) ? PUBLISH_FINDING : null;
}

function classifyRedirect(tokens, index) {
  const token = tokens[index];
  if (!REDIRECT.test(token)) {
    return null;
  }
  const inlineTarget = token.replace(REDIRECT, '');
  const target = inlineTarget === '' ? tokens[index + 1] : inlineTarget;
  return isGitTarget(target) ? GIT_DIR_WRITE_FINDING : null;
}

function classifyGitDirWrite(tokens) {
  const redirect = tokens.reduce((found, token, index) => {
    if (found) {
      return found;
    }
    return classifyRedirect(tokens, index);
  }, null);
  if (redirect) {
    return redirect;
  }
  const writer = tokens.reduce((found, token, index) => {
    if (found || !GIT_DIR_WRITE_COMMANDS.has(token)) {
      return found;
    }
    const args = sliceSegment(tokens, index + 1).filter(
      (arg) => !arg.startsWith('-'),
    );
    return isGitTarget(args[args.length - 1]) ? GIT_DIR_WRITE_FINDING : null;
  }, null);
  return writer;
}

function classifyNestedRuntime(tokens, index) {
  const next = tokens[index + 1];
  if (!next) {
    return NESTED_RUNTIME_FINDING;
  }
  const verb = next.startsWith('-') ? tokens[index + 2] : next;
  return NESTED_RUNTIME_VERBS.has(verb) ? NESTED_RUNTIME_FINDING : null;
}

function classifyShellResource(command) {
  const tokens = tokenizeCommand(command);
  const findings = [];
  tokens.forEach((token, index) => {
    if (!isRunnablePosition(tokens, index)) {
      return;
    }
    if (isGitToken(token)) {
      findings.push(...classifyGitSegment(tokens, index));
    }
    if (token === 'gh') {
      const finding = classifyGhSegment(tokens, index);
      if (finding) {
        findings.push(finding);
      }
    }
    if (token === 'opencode' || token.endsWith('/opencode')) {
      const finding = classifyNestedRuntime(tokens, index);
      if (finding) {
        findings.push(finding);
      }
    }
    if (DESTRUCTIVE_COMMANDS.has(token)) {
      findings.push(DESTRUCTIVE_FINDING);
    }
  });
  const gitDirWrite = classifyGitDirWrite(tokens);
  if (gitDirWrite) {
    findings.push(gitDirWrite);
  }
  return findings;
}

function evaluateShell(resourceList, now, grants) {
  const findings = resourceList.reduce(
    (all, resource) => [...all, ...classifyShellResource(resource)],
    [],
  );
  const denial = findings.find((finding) => finding.kind === 'deny');
  if (denial) {
    return deny(denial.message);
  }
  const publish = findings.some((finding) => finding.kind === 'publish');
  if (publish) {
    const commit = grants ? grants.commit : null;
    if (grantStatus(commit, now).active) {
      return { effect: 'allow' };
    }
    return deny(commit ? MESSAGES.commitExpired : MESSAGES.commitRequired);
  }
  if (findings.some((finding) => finding.kind === 'readonly')) {
    return { effect: 'allow' };
  }
  return { effect: 'pass' };
}

export function evaluatePermission({
  action,
  resources = [],
  projectRoot = '',
  now = 0,
  grants = {},
} = {}) {
  const resourceList = Array.isArray(resources) ? resources : [resources];
  if (action === 'edit') {
    return evaluateEdits(resourceList, projectRoot);
  }
  if (action === 'shell') {
    return evaluateShell(resourceList, now, grants);
  }
  return { effect: 'pass' };
}

function refuse(reason) {
  return { ok: false, reason, usage: LIMITS.usage };
}

function defaultMinutes(defaults) {
  const configured =
    defaults && Number.isFinite(defaults.commitMinutes)
      ? defaults.commitMinutes
      : null;
  const value = configured === null ? DEFAULT_TTLS.commitMinutes : configured;
  return Math.min(Math.max(Math.round(value), MIN_TTL_MINUTES), LIMITS.max);
}

function readTtl(tokens) {
  const first = tokens[0];
  if (!first || !DURATION_SHAPE.test(first)) {
    return { minutes: null, rest: tokens };
  }
  const match = WHOLE_DURATION.exec(first);
  if (!match) {
    return {
      error: 'ttl must be a whole number of minutes or hours, such as 45 or 2h',
    };
  }
  const hours = match[2] === 'h';
  const minutes = Number(match[1]) * (hours ? MINUTES_PER_HOUR : 1);
  if (minutes < MIN_TTL_MINUTES) {
    return { error: 'ttl must be at least 1 minute' };
  }
  if (minutes > LIMITS.max) {
    return { error: `ttl must be at most ${LIMITS.max} minutes` };
  }
  return { minutes, rest: tokens.slice(1) };
}

export function parseCommitCommand({ text, now, defaults }) {
  const tokens = String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const head = tokens[0];
  if (head === 'revoke' || head === 'status') {
    if (tokens.length > 1) {
      return refuse(`\`${head}\` takes no arguments`);
    }
    return { ok: true, action: head, grant: null };
  }
  const ttl = readTtl(tokens);
  if (ttl.error) {
    return refuse(ttl.error);
  }
  const minutes = ttl.minutes === null ? defaultMinutes(defaults) : ttl.minutes;
  const note = ttl.rest.join(' ').trim();
  if (note.length > MAX_NOTE_LENGTH) {
    return refuse(`note must be at most ${MAX_NOTE_LENGTH} characters`);
  }
  if (UNBOUNDED_NOTES.has(note.toLowerCase())) {
    return refuse(
      'note must name the change; * , all, any and everything are refused',
    );
  }
  const durationMs = minutes * MINUTE_MS;
  const expiresAt = now + durationMs;
  return {
    ok: true,
    action: 'grant',
    grant: { note, grantedAt: now, expiresAt },
  };
}

#!/usr/bin/env node
// Validates the pi harness in .pi/ using pi's own resource loaders, so the check
// fails for the same reasons pi would fail at startup. Run via `pnpm pi-check`.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let loadSkills;
let loadPromptTemplates;
try {
  ({ loadSkills } =
    await import('@earendil-works/pi-coding-agent/dist/core/skills.js'));
  ({ loadPromptTemplates } =
    await import('@earendil-works/pi-coding-agent/dist/core/prompt-templates.js'));
} catch {
  const distRoot = await resolvePiDist();
  if (!distRoot) {
    console.error(
      'pi-check: could not locate @earendil-works/pi-coding-agent. Install pi (npm i -g @earendil-works/pi-coding-agent) or add it as a devDependency.',
    );
    process.exit(2);
  }
  ({ loadSkills } = await import(join(distRoot, 'core', 'skills.js')));
  ({ loadPromptTemplates } = await import(
    join(distRoot, 'core', 'prompt-templates.js')
  ));
}

// pi may be installed globally (not resolvable from this repo). Find its dist/
// by reading the `pi` shim's cmd-shim-target, then walking up to the package root.
async function resolvePiDist() {
  const candidates = [];
  try {
    const { execFileSync } = await import('node:child_process');
    const which = execFileSync('which', ['pi'], { encoding: 'utf8' }).trim();
    if (which) {
      const shim = readFileSync(which, 'utf8');
      const target = shim.match(/cmd-shim-target=(.+)/)?.[1]?.trim();
      if (target) {
        // .../node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js
        const marker = 'node_modules/@earendil-works/pi-coding-agent';
        const idx = target.indexOf(marker);
        if (idx !== -1) candidates.push(target.slice(0, idx + marker.length));
      }
    }
  } catch {
    // which/pi unavailable; fall through
  }
  for (const pkgRoot of candidates) {
    const dist = join(pkgRoot, 'dist');
    if (existsSync(join(dist, 'core', 'skills.js'))) return dist;
  }
  return null;
}

const settings = JSON.parse(
  readFileSync(join(repoRoot, '.pi/settings.json'), 'utf8'),
);
const agentDir =
  process.env.PI_AGENT_DIR ?? join(process.env.HOME ?? '', '.pi', 'agent');

// 19 = 10 top-level skills + the 9 `code-review/<doctor>` skills, which pi-check reaches through
// the explicit `settings.json` entries rather than by recursing into `code-review/`.
const EXPECTED_SKILLS = 19;
// `.pi/skills/` is the only skill registry. Zero is the value that keeps it that way: a `skills/`
// directory reappearing under `.pi/agents/` is a second registry, and it turns red here rather than
// becoming a third copy of a rule nobody notices drifting.
const EXPECTED_PRIVATE_SKILLS = 0;
const EXPECTED_PROMPTS = 10;
const EXPECTED_AGENTS = [
  'orchestrator',
  'planner',
  'explorer',
  'frontend-dev',
  'backend-dev',
  'tester',
  'reviewer',
  'critic',
  'browser-verifier',
];

// --- Architecture boundary: Workflow -> Agent -> Skill -> Reference/Script ---
//
// The direction is one-way, and these checks exist because nothing else in the harness makes a
// violation visible. A skill that routes work to a lane, an agent that dispatches, a second skill
// registry, or a load-order loop between two skills all load cleanly in pi and change behaviour
// silently. Every message below is prefixed ARCHITECTURE_VIOLATION: because a broken dependency
// direction is a different error class from a missing file, and the reader needs to know which
// one they hit.

// The agent names that count as a lane for the skill -> agent check.
const LANE_NAMES = EXPECTED_AGENTS;

// A skill may name a lane where it is naming the role it constrains a rule about, or where the name
// is an example of a value the harness stores rather than a route to take. Each exception is pinned
// to the file AND to the exact text of the line, so editing that line retires the exception instead
// of silently widening it. Keep this list short: every entry is a place the dependency direction
// has to be argued for, and an entry nobody can justify is a rule that was given away. Empty today:
// the two grant facts that would name a lane sit in `harness-validator/SKILL.md` — back under
// `.pi/skills/` since the move from `.pi/harness-validator.md` — and are written as role/stage
// expressions ("the review lane", "the frontend implementation lane"), so the lane-name scan
// over `.pi/skills/` finds nothing to flag.
const SKILL_TO_AGENT_ALLOWLIST = [];

// A skill may point at a workflow only to name where a fact lives. Needing a workflow to run, or
// routing work to one, inverts Workflow -> Agent -> Skill: the workflow owns the sequence, and a
// skill reaching up into it is a second place the process lives. Pinning and reasons work exactly
// as they do for SKILL_TO_AGENT_ALLOWLIST above, and the reason is not optional — the check below
// fails on an entry that has none.
//
// Each entry authorises ONE pointer: one `target`, on one `line`, in one `file`. `target` is the
// repo-relative path the destination resolves to, so an entry cannot be stretched to cover a second
// workflow link appended to the same line — the line pin alone would allow that, and a pin that
// covers more than it names is the hole this list is checked against. All three conditions must
// hold; editing the pinned line retires the entry rather than silently widening it.
const SKILL_TO_WORKFLOW_ALLOWLIST = [
  {
    // The `workflow` field's mapping.
    file: '.pi/skills/task-classification/SKILL.md',
    target: '.pi/workflows/harness-process.md',
    line: '  [harness-process.md](../../workflows/harness-process.md#routing-a-request-to-a-workflow).',
    reason:
      'The `workflow` field names the canonical prompt it routes to, and the mapping lives in the shared process document rather than in one of the ten workflow prompts. This skill emits the artifact that selects a workflow and disclaims owning the sequence that follows, so naming where the mapping lives is a pointer and not a dependency.',
  },
  {
    // The type-to-prompt mapping, and the lane shape that complexity, risk, and domains imply.
    file: '.pi/skills/task-classification/SKILL.md',
    target: '.pi/workflows/harness-process.md',
    line: 'are in [harness-process.md](../../workflows/harness-process.md#routing-a-request-to-a-workflow). This',
    reason:
      'Same pointer as the `workflow` field above: the mapping this skill applies is documented in the shared process document, and the skill says of itself that it produces the artifact which selects a workflow and does not own the sequence.',
  },
  {
    // Where a worker is sent when a contract turns out to be insufficient.
    file: '.pi/skills/task-classification/SKILL.md',
    target: '.pi/workflows/harness-process.md',
    line: '[the contract change gate](../../workflows/harness-process.md#the-contract-change-gate).',
    reason:
      'The contract change gate is a rule the coordinating agent enforces, not one of the nine stages of the gate sequence — it is a subsection of "The coordination role\'s rules" in the shared process document. The skill\'s own next move is to emit the artifact that selects a workflow, so it points at where the rule is documented rather than depending on it.',
  },
  {
    // The lane shape each worked example implies.
    file: '.pi/skills/task-classification/references/worked-examples.md',
    target: '.pi/workflows/harness-process.md',
    line: '([harness-process.md](../../../workflows/harness-process.md#lane-shapes)). Each is a request in',
    reason:
      'The examples are built on the two routing shapes, and the lane shapes those key on are documented in the shared process document rather than in this reference. The reference names where the fact lives; it does not need the workflow to run.',
  },
];

// A cycle that survives the `## Related` filter is a load-order loop: A must be read before B and B
// before A, so no ordering satisfies both. Nothing listed here today, because every symmetric
// "see also" reference in the repo now lives inside a `## Related` section and is filtered by rule
// rather than by an entry — 0 cycles survive the filter. The constant stays because the rule it
// backs is "anything not justified here fails", and a justified pair is a decision someone has to
// make in writing; if a real cycle ever appears that is genuinely symmetric, add its SORTED
// NODE-SET below with the reason it carries no ordering. Entries are matched as a sorted node-set,
// so a 2-node pair is a different key from the 3-node triangle that contains it.
//
// Do NOT extend the filter to the `## Doctor` sections, which look like a second see-also section
// and are not. Four of the surviving edges are a skill naming the doctor that reviews it, and the
// doctor's own back-reference is the half that sits in `## Related`. Filtering both halves would
// drop the `frontend-patterns/references -> react-doctor` pairing silently, and that pair carries
// weight: `react-doctor` exists to review the frontend references (`react-standards.md` names it in
// `## Doctor`; the doctor names the reference back in `## Related`), so a future rule written from
// a skill into its own doctor is a real ordering edge the check must keep hold of. Symmetry of the
// reference is the thing that decides it, not the name of the section it sits in.
const ALLOWED_SKILL_CYCLES = [];

// Only the coordinating agent may dispatch. A second dispatcher is a second place the process
// lives, and the process has exactly one owner.
const DISPATCH_AGENT = 'orchestrator';

// Escape hatch for a project skill that is reachable some way other than an agent's
// `skills:` grant. The eight doctors `code-review` dispatches to by path at review time are
// reached through that meta-skill's dispatch table, not through frontmatter, so requiring a
// grant for them would only push someone to add a redundant one. `react-doctor` is deliberately
// NOT in this list: `frontend-dev` runs it as a mandatory self-check and needs the pinned
// version, so its grant is what keeps the pinned version in the skill instead of restated in a
// prompt body. Add a name here ONLY with the indirection that reaches it written in the comment.
const CATALOG_ONLY_SKILLS = [
  'architecture-doctor',
  'backend-doctor',
  'boundary-doctor',
  'i18n-doctor',
  'style-doctor',
  'test-doctor',
  'typecheck-doctor',
  'typescript-doctor',
];

const failures = [];
const warnings = [];

// Project packages declared in settings.json. npm sources install under .pi/npm,
// which .pi/npm/.gitignore excludes, so a fresh clone must run `pi install`.
const packageSkillPaths = [];
const packagePromptPaths = [];
for (const source of settings.packages ?? []) {
  const match = /^npm:(.+)$/.exec(source);
  if (!match) continue;
  const pkgName = match[1].replace(/@[^/@]+$/, '');
  const pkgRoot = join(repoRoot, '.pi', 'npm', 'node_modules', pkgName);
  if (!existsSync(pkgRoot)) {
    failures.push(`${source}: not installed — run \`pi install\``);
    continue;
  }
  const manifest = JSON.parse(
    readFileSync(join(pkgRoot, 'package.json'), 'utf8'),
  );
  for (const path of manifest.pi?.skills ?? [])
    packageSkillPaths.push(join(pkgRoot, path));
  for (const path of manifest.pi?.prompts ?? [])
    packagePromptPaths.push(join(pkgRoot, path));
  for (const path of manifest.pi?.extensions ?? []) {
    if (!existsSync(join(pkgRoot, path)))
      failures.push(`${source}: missing extension ${path}`);
  }
}

const skills = loadSkills({
  cwd: repoRoot,
  agentDir,
  skillPaths: [...(settings.skills ?? []), ...packageSkillPaths],
  includeDefaults: false,
});

const prompts = loadPromptTemplates({
  cwd: repoRoot,
  agentDir,
  promptPaths: [...(settings.prompts ?? []), ...packagePromptPaths],
  includeDefaults: false,
});

const projectSkills = loadSkills({
  cwd: repoRoot,
  agentDir,
  skillPaths: settings.skills ?? [],
  includeDefaults: false,
});

const projectPrompts = loadPromptTemplates({
  cwd: repoRoot,
  agentDir,
  promptPaths: settings.prompts ?? [],
  includeDefaults: false,
});

if (projectSkills.skills.length !== EXPECTED_SKILLS) {
  failures.push(
    `expected ${EXPECTED_SKILLS} project skills, pi loaded ${projectSkills.skills.length}`,
  );
}
if (projectPrompts.templates.length !== EXPECTED_PROMPTS) {
  failures.push(
    `expected ${EXPECTED_PROMPTS} project prompt commands, pi loaded ${projectPrompts.templates.length}`,
  );
}

// These files are pi-owned, so pi's own warnings are treated as failures: an invalid
// skill name or unparseable frontmatter silently breaks a command even though the
// resource still loads.
for (const diagnostic of [...skills.diagnostics, ...prompts.diagnostics]) {
  // A name collision is asserted on its own below, against the structured `collision` field, so
  // the reader gets the message that says what the collision costs instead of pi's bare
  // `name "..." collision`. Skipping it here rather than filtering it out of the array means a
  // future pi that stops setting that type falls through this loop and still fails the run. The
  // check below cannot become dormant while that is true.
  if (diagnostic.type === 'collision') continue;
  const where = diagnostic.path.replace(`${repoRoot}/`, '');
  const message = diagnostic.message.split('\n')[0];
  failures.push(`${where}: ${message}`);
  if (diagnostic.type === 'warning') warnings.push(`${where}: ${message}`);
}

// Duplicate skill name. This reads pi's `collision` diagnostic rather than `skills.skills`, which
// pi has already deduplicated by name: the loser of a collision never reaches that array, so no
// count taken from it can ever repeat, and an assertion written against it can never fire. The
// condition is real and it is not a warning. Two resources answer to one invocable name,
// `/skill:<name>` resolves to whichever pi loaded first, and the other becomes unreachable behind a
// name that still looks live in the catalog.
//
// The match is on `type`, a structured field, not on the message text. `collision` is the literal
// pi pushes in core/skills.js and nothing else in the resource pipeline emits it, so a
// false positive is not reachable: a false *negative* is, if pi renames the type, and the loop
// above is what catches that case.
const collisions = [...skills.diagnostics, ...prompts.diagnostics].filter(
  (diagnostic) => diagnostic.type === 'collision',
);
for (const diagnostic of collisions) {
  const { name, winnerPath, loserPath } = diagnostic.collision ?? {};
  if (!name) {
    failures.push(
      `ARCHITECTURE_VIOLATION: duplicate skill name — ${diagnostic.path.replace(`${repoRoot}/`, '')}: ${diagnostic.message.split('\n')[0]}, with no collision details to report which resource lost.`,
    );
    continue;
  }
  failures.push(
    `ARCHITECTURE_VIOLATION: duplicate skill name — ${relative(repoRoot, loserPath ?? diagnostic.path)} claims \`${name}\`, already loaded from ${relative(repoRoot, winnerPath ?? 'an earlier skill path')}. Two resources answer to one invocable name, so /skill:${name} resolves to whichever pi loaded first and the other is unreachable.`,
  );
}

console.log(
  `skills:  ${projectSkills.skills.length}/${EXPECTED_SKILLS} project, ${skills.skills.length} total`,
);
console.log(
  `prompts: ${projectPrompts.templates.length}/${EXPECTED_PROMPTS} project, ${prompts.templates.length} total`,
);

// --- Agent discovery ---

function scanAgents(dir) {
  const agents = [];
  if (!existsSync(dir)) return agents;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'references' || entry.name === 'skills') continue;
      agents.push(...scanAgents(full));
    } else if (
      entry.name.endsWith('.md') &&
      !entry.name.startsWith('.') &&
      entry.name !== 'SKILL.md' &&
      entry.name !== 'references'
    ) {
      const raw = readFileSync(full, 'utf8');
      const match = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!match) {
        warnings.push(`${full.replace(repoRoot + '/', '')}: no frontmatter`);
        continue;
      }
      const fm = match[1];
      const nameMatch = fm.match(/^name:\s*(.+)/m);
      const descMatch = fm.match(/^description:\s*(.+)/m);
      const skillsMatch = fm.match(/^skills:\s*(.+)/m);
      const allowedMatch = fm.match(/^allowedAgents:\s*(.+)/m);
      const toolsMatch = fm.match(/^tools:\s*(.+)/m);
      const nestedMatch = fm.match(/^allowNestedSubagents:\s*(.+)/m);
      const skillPathMatch = fm.match(/^skillPath:\s*(.+)/m);
      const inheritSkillsMatch = fm.match(/^inheritSkills:\s*(.+)/m);
      const splitList = (value) =>
        value
          ?.split(/\s*,\s*/)
          .map((s) => s.trim())
          .filter(Boolean);
      agents.push({
        path: full,
        name: nameMatch?.[1]?.trim(),
        description: descMatch?.[1]?.trim(),
        skills: splitList(skillsMatch?.[1]),
        allowedAgents: splitList(allowedMatch?.[1]),
        tools: splitList(toolsMatch?.[1]),
        allowNestedSubagents: nestedMatch?.[1]?.trim(),
        skillPath: skillPathMatch?.[1]?.trim(),
        inheritSkills: inheritSkillsMatch?.[1]?.trim(),
        body: raw.slice(match[0].length),
      });
    }
  }
  return agents;
}

const discoveredAgents = scanAgents(join(repoRoot, '.pi', 'agents'));
const discoveredNames = discoveredAgents.map((a) => a.name).filter(Boolean);

// Check required agents exist
for (const expected of EXPECTED_AGENTS) {
  if (!discoveredNames.includes(expected)) {
    failures.push(`agent not found: ${expected}`);
  }
}

// Check agent frontmatter validity
const knownSkillNames = new Set(projectSkills.skills.map((s) => s.name));

// One definition of a `**Field:** value` declaration line in an agent body, shared by the two
// readers below so they cannot disagree about what counts as declared. The separator is `[^\S\n]`
// rather than `\s`, because `\s` spans newlines and a bare `**Domain:**` would borrow the first
// character of the next line and pass.
const DECLARED_FIELD_VALUE = {
  // A role is a word, and `requiredAgents` is matched against the whole token.
  Role: '[A-Za-z][A-Za-z-]*',
  // A domain is any non-whitespace token: the lanes that are not domain workers declare `—`, and
  // that is a declared value, not an absent one. What is forbidden is having no value on the line.
  Domain: '\\S',
};
const declaredField = (field) =>
  new RegExp(`\\*\\*${field}:\\*\\*[^\\S\\n]+(${DECLARED_FIELD_VALUE[field]})`);

// Roles are declared in agent bodies, so the set is derived rather than listed here: a role an
// agent stops declaring is a role nothing can claim. `task-classification` emits `requiredAgents`
// by role, because a skill that named a lane would be routing work, and the orchestrator resolves
// each role to the lane that fills it.
const declaredRoles = new Set();
for (const agent of discoveredAgents) {
  const role = (agent.body ?? '').match(declaredField('Role'))?.[1];
  if (role) declaredRoles.add(role);
}

// Agent-private skills (discovered via skillPath, not in settings.skills)
// Finds any skills/ directory at any depth under .pi/agents/
function scanAgentPrivateSkills() {
  const found = [];
  const agentsRoot = join(repoRoot, '.pi', 'agents');
  if (!existsSync(agentsRoot)) return found;

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (!entry.isDirectory()) continue;
      if (entry.name === 'skills') {
        for (const skillEntry of readdirSync(full, { withFileTypes: true })) {
          const skillFile = join(full, skillEntry.name, 'SKILL.md');
          if (!skillEntry.isDirectory() || !existsSync(skillFile)) continue;
          const raw = readFileSync(skillFile, 'utf8');
          const nameMatch = raw.match(/^name:\s*(.+)/m);
          const name = nameMatch?.[1]?.trim();
          if (name) {
            found.push({
              name,
              path: skillFile,
              agent: relative(agentsRoot, dir),
              agentSkillDir: full,
            });
            knownSkillNames.add(name);
          }
        }
      } else {
        walk(full);
      }
    }
  }
  walk(agentsRoot);
  return found;
}

const privateSkills = scanAgentPrivateSkills();

if (privateSkills.length !== EXPECTED_PRIVATE_SKILLS) {
  failures.push(
    `expected ${EXPECTED_PRIVATE_SKILLS} agent-private skills, found ${privateSkills.length}`,
  );
}

for (const agent of discoveredAgents) {
  if (!agent.name) {
    failures.push(
      `${agent.path.replace(repoRoot + '/', '')}: missing name in frontmatter`,
    );
    continue;
  }
  if (!agent.description) {
    warnings.push(`${agent.name}: missing description`);
  }
  // Check skill references
  for (const skill of agent.skills ?? []) {
    if (!knownSkillNames.has(skill)) {
      failures.push(`agent ${agent.name} references unknown skill: ${skill}`);
    }
  }
}

console.log(
  `agents:  ${discoveredNames.length} discovered (required: ${EXPECTED_AGENTS.join(', ')})`,
);
console.log(
  `agent-private skills: ${privateSkills.length} (${privateSkills.map((s) => s.name).join(', ') || 'none'})`,
);

// --- Reference resolution ---

// An agent name that resolves to nothing is not an error anywhere in pi: the
// dispatch silently falls back to a default agent, and the only thing lost is the
// methodology the lane was supposed to carry. Rename one lane and every pointer to
// it keeps working while pointing somewhere else, so the name must be checked against
// the agents actually discovered on disk.
for (const agent of discoveredAgents) {
  for (const allowed of agent.allowedAgents ?? []) {
    if (!discoveredNames.includes(allowed)) {
      failures.push(
        `agent ${agent.name} allows unknown agent: ${allowed} (allowedAgents)`,
      );
    }
  }
}

// Same failure one layer out: an agentOverrides key left behind by a rename is inert,
// so the renamed agent silently runs at pi's default thinking level.
for (const key of Object.keys(settings.subagents?.agentOverrides ?? {})) {
  if (!discoveredNames.includes(key)) {
    failures.push(`settings.json agentOverrides has unknown agent: ${key}`);
  }
}

// And one layer deeper still, in the skills themselves: a `requiredAgents` array naming an
// agent that no longer exists. `task-classification` fixes that array as its contract and its
// worked examples are copied verbatim by whoever runs them, so a name left behind by a rename
// becomes a dispatch that resolves to nothing — and nothing else here reads a skill's body.
// Only the array is parsed, never prose. An entry may be an agent name or a role; either way it
// must resolve to something real.
function scanSkillMarkdown(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) scanSkillMarkdown(full, found);
    else if (entry.name.endsWith('.md')) found.push(full);
  }
  return found;
}

function unwrapAngleBrackets(destination) {
  return destination.startsWith('<') && destination.endsWith('>')
    ? destination.slice(1, -1)
    : destination;
}

// Every markdown link destination in a file, as { index, line, destination }. Three forms reach a
// path and all three are read: an inline `](dest)`, whose dest may be wrapped in `<>`; a
// reference-style link — full `[text][label]`, collapsed `[text][]`, or shortcut `[label]` —
// resolved through the file's own `[label]: dest` definitions; and the definition line itself,
// which is a destination in its own right. A label with no definition is prose, not a link, and
// yields nothing.
function markdownLinkDestinations(text) {
  const definitions = new Map();
  for (const match of text.matchAll(/^\s{0,3}\[([^\]]+)\]:[ \t]*(\S+)/gm)) {
    if (!definitions.has(match[1])) definitions.set(match[1], match[2]);
  }
  const defined = (label) => definitions.has(label);
  const destinations = [];
  text.split('\n').forEach((line, index) => {
    const definition = /^\s{0,3}\[([^\]]+)\]:[ \t]*(\S+)/.exec(line);
    if (definition) {
      destinations.push({
        index,
        line,
        destination: unwrapAngleBrackets(definition[2]),
      });
    }
    for (const match of line.matchAll(/\]\(([^)\s]+)/g)) {
      destinations.push({
        index,
        line,
        destination: unwrapAngleBrackets(match[1]),
      });
    }
    for (const match of line.matchAll(/\[([^\]]*)\]\[([^\]]*)\]/g)) {
      const label = match[2] || match[1];
      if (defined(label)) {
        destinations.push({
          index,
          line,
          destination: unwrapAngleBrackets(definitions.get(label)),
        });
      }
    }
    // A `[text][label]` pair's second bracket is a label, not a shortcut link, so it is skipped
    // here by the character before it — otherwise a reference-style link is counted twice. A
    // definition line is skipped because its label is a label, not a link.
    if (definition) return;
    for (const match of line.matchAll(/\[([^\]]+)\](?![[(])/g)) {
      if (match.index > 0 && line[match.index - 1] === ']') continue;
      if (defined(match[1])) {
        destinations.push({
          index,
          line,
          destination: unwrapAngleBrackets(definitions.get(match[1])),
        });
      }
    }
  });
  return destinations;
}

for (const file of scanSkillMarkdown(join(repoRoot, '.pi', 'skills'))) {
  const raw = readFileSync(file, 'utf8');
  for (const match of raw.matchAll(/"requiredAgents"\s*:\s*\[([^\]]*)\]/g)) {
    const bodyStart = match.index + match[0].length - match[1].length;
    for (const entry of match[1].matchAll(/"([^"]+)"/g)) {
      if (!discoveredNames.includes(entry[1]) && !declaredRoles.has(entry[1])) {
        const line = raw.slice(0, bodyStart + entry.index).split('\n').length;
        failures.push(
          `${relative(repoRoot, file)}:${line}: requiredAgents names unknown agent or role: ${entry[1]}`,
        );
      }
    }
  }
}

// skillPath is discovery-only. A typo'd or moved path resolves to nothing and the
// agent loses its private skills with no diagnostic anywhere — it just runs with less
// methodology than its own definition claims.
const privateSkillDirs = new Set();
for (const agent of discoveredAgents) {
  if (!agent.skillPath) continue;
  const resolved = resolve(dirname(agent.path), agent.skillPath);
  privateSkillDirs.add(resolved);
  if (!existsSync(resolved)) {
    failures.push(
      `agent ${agent.name}: skillPath does not exist: ${agent.skillPath} (${relative(repoRoot, resolved)})`,
    );
  }
}

// The inverse: a private skill no agent's skillPath reaches is dead weight. Nothing
// loads it, and because it still parses as a valid skill it looks live on disk.
for (const skill of privateSkills) {
  if (
    ![...privateSkillDirs].some(
      (dir) => resolve(dir) === resolve(skill.agentSkillDir),
    )
  ) {
    failures.push(
      `agent-private skill unreachable from any skillPath: ${skill.name} (${relative(repoRoot, skill.path)})`,
    );
  }
}

// Every project skill must be granted somewhere. This is the check that keeps a
// project skill from becoming invisible: a doctor promoted from agent-private to
// project is only loaded by an agent if that agent still grants it, and dropping the
// grant is invisible to every other check here.
const grantedSkills = new Set();
for (const agent of discoveredAgents) {
  for (const skill of agent.skills ?? []) grantedSkills.add(skill);
}
for (const skill of projectSkills.skills) {
  if (grantedSkills.has(skill.name) || CATALOG_ONLY_SKILLS.includes(skill.name))
    continue;
  failures.push(`project skill granted by no agent: ${skill.name}`);
}

// `inheritSkills: false` strips Pi's whole discovered skills catalog, and pi selects what
// remains purely from `skills:`. An agent that declares it while granting nothing therefore
// runs with zero skills — no diagnostic, and nothing in the body to say so, since prose
// describing a rule is not a grant. Pair the two.
for (const agent of discoveredAgents) {
  if (agent.inheritSkills === 'false' && !(agent.skills?.length > 0)) {
    failures.push(
      `agent ${agent.name}: inheritSkills: false with no skills: grant — it would run with no skills at all`,
    );
  }
}

// pi has no `role`, `domain`, or `capabilities` frontmatter field, so an agent's body is the
// only place either can be declared — and an agent's body *is* its system prompt, which is
// where the pair is actually enforced. Nothing else in this script reads a body, so a lane
// that silently lost its `Role:`/`Domain:` header would keep loading, keep being dispatched,
// and keep reading as if the harness were organised by domain when nothing says which role it
// holds. Declared in the body, it fails here instead.
for (const agent of discoveredAgents) {
  for (const field of Object.keys(DECLARED_FIELD_VALUE)) {
    if (!declaredField(field).test(agent.body ?? '')) {
      failures.push(
        `${relative(repoRoot, agent.path)}: missing **${field}:** declaration in the agent body`,
      );
    }
  }
}

// Deduplicate agent names
const agentNameCounts = {};
for (const name of discoveredNames)
  agentNameCounts[name] = (agentNameCounts[name] || 0) + 1;
for (const [name, count] of Object.entries(agentNameCounts)) {
  if (count > 1)
    failures.push(`duplicate agent name: ${name} (${count} files)`);
}

// --- Architecture boundary checks ---
// Workflow -> Agent -> Skill -> Reference/Script, one way. A violation of that direction loads
// cleanly in pi and changes behaviour silently, which is why each of these is checked rather than
// left to review.

const skillsRoot = join(repoRoot, '.pi', 'skills');
const skillFiles = scanSkillMarkdown(skillsRoot);

// 1. skill -> agent. A skill teaches a capability. It does not route work to a lane, and it does
// not own the process. Naming a lane is legitimate where a rule binds that role, or where the name
// is an example of a value the harness stores; both live on the allowlist above with the reason.
const lanePattern = new RegExp('`(' + LANE_NAMES.join('|') + ')`', 'g');
for (const file of skillFiles) {
  const relPath = relative(repoRoot, file);
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((text, index) => {
      for (const match of text.matchAll(lanePattern)) {
        const lane = match[1];
        const allowed = SKILL_TO_AGENT_ALLOWLIST.some(
          (entry) => entry.file === relPath && text.includes(entry.line),
        );
        if (allowed) continue;
        failures.push(
          `ARCHITECTURE_VIOLATION: skill -> agent — ${relPath}:${index + 1}: names the lane \`${lane}\`. Name the role or the stage instead, or link the process file.`,
        );
      }
    });
}

// 2. agent-local skill registry. The private-skill count above catches a `skills/` directory that
// holds a loadable SKILL.md; this catches the directory itself, including an empty one or one whose
// skill is malformed enough that the loader never sees it. Either way `.pi/skills/` is no longer
// the only registry, and a skill granted from two places drifts.
function scanAgentSkillDirs(dir = join(repoRoot, '.pi', 'agents'), found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name === 'skills') found.push(relative(repoRoot, full));
    else scanAgentSkillDirs(full, found);
  }
  return found;
}
for (const dir of scanAgentSkillDirs()) {
  failures.push(
    `ARCHITECTURE_VIOLATION: agent-local skill registry — ${dir}: .pi/skills/ is the only registry. An agent reaches a skill by granting its name in frontmatter, and a second registry is a second copy of every rule in it.`,
  );
}

// 3. non-orchestrator agent holds dispatch. The process has exactly one owner. A second dispatcher
// is a second place the sequence lives, and the two copies diverge without anything noticing.
for (const agent of discoveredAgents) {
  if (agent.name === DISPATCH_AGENT) continue;
  if (agent.tools?.includes('subagent')) {
    failures.push(
      `ARCHITECTURE_VIOLATION: non-orchestrator agent holds dispatch — ${relative(repoRoot, agent.path)}: \`${agent.name}\` holds the \`subagent\` tool. Only \`${DISPATCH_AGENT}\` may dispatch.`,
    );
  }
  if (agent.allowNestedSubagents === 'true') {
    failures.push(
      `ARCHITECTURE_VIOLATION: non-orchestrator agent holds dispatch — ${relative(repoRoot, agent.path)}: \`${agent.name}\` sets \`allowNestedSubagents: true\`. Only \`${DISPATCH_AGENT}\` may dispatch.`,
    );
  }
}

// 4. circular skill dependency. The graph is the relative `../<name>/SKILL.md` links between
// skills, matched at ANY `../` depth and excluding the links inside a `## Related` section. A cycle
// is a violation when it is a load-order loop: each member would have to be read before the next
// and no ordering satisfies both. A `## Related` block is a "see also" list — it asserts that two
// skills are neighbours, symmetrically, and carries no read order — so it is the reasoning the
// hand-listed pairs below rest on, applied to a section rather than to a pair. What is left is an
// ordering graph, and a cycle in it is a real load-order loop unless ALLOWED_SKILL_CYCLES says why
// it is not.

// The offsets a `## Related` section covers: its heading line through the line before the next
// heading of level 1 or 2, or the end of the file. A level-2 heading whose entire title is `Related`,
// case-insensitively, so `### Related` and `## Related work` do not match. A section is a property
// of a link's position, not of its shape, so it is found by position.
function relatedSections(raw) {
  const lines = raw.split('\n');
  const offsets = [];
  let at = 0;
  for (const line of lines) {
    offsets.push(at);
    at += line.length + 1;
  }
  const ranges = [];
  let start = null;
  lines.forEach((line, index) => {
    const heading = line.match(/^(#{1,6})\s+(.*?)\s*$/);
    if (!heading) return;
    const level = heading[1].length;
    if (start !== null && level <= 2) {
      ranges.push([start, offsets[index]]);
      start = null;
    }
    if (level === 2 && /^related$/i.test(heading[2])) start = offsets[index];
  });
  if (start !== null) ranges.push([start, raw.length]);
  return ranges;
}
const isSeeAlso = (ranges, offset) =>
  ranges.some(([from, to]) => offset >= from && offset < to);

const skillIdByFile = new Map();
for (const file of skillFiles) {
  const id = relative(skillsRoot, dirname(file)).split(sep).join('/');
  skillIdByFile.set(resolve(file), id);
}
const skillGraph = new Map();
let seeAlsoLinks = 0;
let seeAlsoSections = 0;
for (const file of skillFiles) {
  const from = skillIdByFile.get(resolve(file));
  const raw = readFileSync(file, 'utf8');
  const related = relatedSections(raw);
  seeAlsoSections += related.length;
  const targets = new Set();
  for (const match of raw.matchAll(
    /\]\(((?:\.\.\/)+)([a-z0-9-]+(?:\/[a-z0-9-]+)*)\/SKILL\.md(?:#[^)]*)?\)/g,
  )) {
    // The prefix is consumed as written and resolved with it, because the depth is what the link
    // says. The frontend references sit one level deeper than the top-level skills, so their links
    // are written `../../code-review/react-doctor/SKILL.md`; assuming a single level up and appending
    // the sibling under the reference's own directory resolves nothing, every lookup misses, and the
    // graph comes out smaller than the repo — a cycle check that passes because it never saw an edge.
    const to = skillIdByFile.get(
      resolve(dirname(file), match[1], match[2], 'SKILL.md'),
    );
    if (!to) continue;
    if (isSeeAlso(related, match.index)) {
      seeAlsoLinks++;
      continue;
    }
    targets.add(to);
  }
  skillGraph.set(from, [...targets].sort());
}
// Counted off the graph rather than accumulated per file: several `.md` files share a directory
// (every `references/` directory holds more than one), and they collapse to one node id, so a
// running total would count their edges more than once and print a graph that does not exist.
const orderingEdges = [...skillGraph.values()].reduce(
  (n, targets) => n + targets.length,
  0,
);

function* elementaryCycles(graph) {
  for (const start of [...graph.keys()].sort()) {
    function* walk(current, path) {
      for (const next of graph.get(current) ?? []) {
        if (next === start) {
          yield path;
          continue;
        }
        // Never step back onto an earlier node than the start, so a cycle is generated once per
        // starting rotation rather than once per node it contains.
        if (next < start || path.includes(next)) continue;
        yield* walk(next, [...path, next]);
      }
    }
    yield* walk(start, [start]);
  }
}

const allowedCycles = new Set(
  ALLOWED_SKILL_CYCLES.map((cycle) => cycle.slice().sort().join('|')),
);
const seenCycles = new Map();
for (const cycle of elementaryCycles(skillGraph)) {
  const key = cycle.slice().sort().join('|');
  if (seenCycles.has(key)) continue;
  // Rotate to start at the lowest-sorting member so the message names one stable reading of the
  // cycle rather than whichever rotation the walk happened to reach first.
  const sorted = cycle.slice().sort();
  const head = cycle.indexOf(sorted[0]);
  seenCycles.set(key, [...cycle.slice(head), ...cycle.slice(0, head)]);
}
for (const [key, cycle] of seenCycles) {
  if (allowedCycles.has(key)) continue;
  failures.push(
    `ARCHITECTURE_VIOLATION: circular skill dependency — ${cycle.join(' -> ')} -> ${cycle[0]}. Each must be read before the next, so no order satisfies both. If the references are a symmetric "see also", move them into the \`## Related\` section of the skills that cite them; only a cycle that is genuinely not a see-also belongs in ALLOWED_SKILL_CYCLES, with the reason it carries no ordering.`,
  );
}

console.log(
  `skill graph: ${skillGraph.size} nodes, ${orderingEdges} ordering edges, ${seeAlsoLinks} links inside ${seeAlsoSections} \`## Related\` sections filtered out`,
);

// 5. skill -> workflow. The third edge of the same boundary, and the one most likely to be added
// by accident: a skill that says "the mapping is in the harness process" is one link away from a
// skill that says "run the bug-fix workflow", and only the second one inverts the direction.
//
// Scope, stated once so the code and this comment cannot disagree: ANY markdown link destination
// in `.pi/skills/**` that resolves to a path inside `.pi/workflows/`, including the directory
// itself, is in scope. That covers an inline `](../../workflows/bug-fix.md)`, a directory link
// `](../../workflows/)`, an angle-bracket destination `](<../../workflows/bug-fix.md>)`, and a
// reference-style `[text][label]` resolved through the file's own `[label]:` definition — the
// definition line is a destination in its own right and is counted too, so a reference-style
// pointer is never half counted. A directory link is a pointer into the workflow tree rather than
// a link to a capability, so it is not exempt either: it belongs on the allowlist, with its target
// and its reason, if anyone genuinely needs it.
//
// The destination is resolved against the linking file's own directory and tested for landing inside
// `.pi/workflows/`, never matched on the substring `workflows/`. Resolving is what keeps a pointer at
// the CI workflow that pins a doctor's version out of scope: `code-review/react-doctor/SKILL.md:19`
// names `.github/workflows/react-doctor.yml` as the source of the pinned version, which is a
// capability fact about an external tool and not a harness workflow, and a substring test flags it
// and forces a bogus allowlist entry to silence it.
//
// A bare backticked path is not a link and is never read here. `task-classification/SKILL.md:162`
// lists `.pi/workflows` among the paths a harness change may not take a lightweight path through —
// a scope list naming where rules live, not a dependency on one, and there is nothing to allowlist.
const workflowsRoot = join(repoRoot, '.pi', 'workflows');
const isWorkflowPath = (target) =>
  target === workflowsRoot || target.startsWith(workflowsRoot + sep);
let workflowPointers = 0;
let workflowAllowlisted = 0;
for (const entry of SKILL_TO_WORKFLOW_ALLOWLIST) {
  if (!entry.reason?.trim()) {
    failures.push(
      `ARCHITECTURE_VIOLATION: skill -> workflow — ${entry.file}: allowlist entry has no reason. A pointer is only legitimate when the reason it is not a dependency is written down.`,
    );
  }
  // An entry whose target is missing or resolves outside the tree can never match a pointer, so it
  // would sit here reading as a covered one while granting nothing.
  const entryTarget = entry.target && resolve(repoRoot, entry.target);
  if (!entryTarget || !isWorkflowPath(entryTarget)) {
    failures.push(
      `ARCHITECTURE_VIOLATION: skill -> workflow — ${entry.file}: allowlist entry has no \`target\` that resolves inside .pi/workflows/. An entry that can never match a pointer is a rule that reads as covered and is not.`,
    );
  }
}
for (const file of skillFiles) {
  const relPath = relative(repoRoot, file);
  for (const link of markdownLinkDestinations(readFileSync(file, 'utf8'))) {
    // An anchor or query is not part of the path, and a URL is not a path at all.
    const path = link.destination.split('#')[0].split('?')[0];
    if (!path || /^[a-z][a-z0-9+.-]*:/i.test(path)) continue;
    const target = resolve(dirname(file), path);
    if (!isWorkflowPath(target)) continue;
    workflowPointers++;
    const allowed = SKILL_TO_WORKFLOW_ALLOWLIST.some(
      (entry) =>
        entry.file === relPath &&
        link.line.includes(entry.line) &&
        entry.target === relative(repoRoot, target),
    );
    if (allowed) {
      workflowAllowlisted++;
      continue;
    }
    failures.push(
      `ARCHITECTURE_VIOLATION: skill -> workflow — ${relPath}:${link.index + 1}: links to ${relative(repoRoot, target)}, which is a workflow. A skill teaches a capability; it does not route work to a workflow and does not own the sequence. Name the capability and the stage instead, or add the pointer to SKILL_TO_WORKFLOW_ALLOWLIST with the reason it is a pointer and not a dependency.`,
    );
  }
}

console.log(
  `skill -> workflow: ${workflowPointers} pointers, ${workflowAllowlisted} allowlisted`,
);

for (const warning of warnings) console.warn(`warn  ${warning}`);

if (failures.length > 0) {
  for (const failure of failures) console.error(`fail  ${failure}`);
  process.exit(1);
}

console.log('pi harness OK');

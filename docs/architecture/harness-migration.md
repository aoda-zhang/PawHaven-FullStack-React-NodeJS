# Harness migration

How PawHaven's AI development harness moved from a Pi-first, Pi-owned `.pi/` directory to a
provider-neutral canonical `harness-core/` plus runtime adapters, and what each decision was.

The design this migration implements is in
[harness-core/ARCHITECTURE.md](../../harness-core/ARCHITECTURE.md). This document is the record of the
change, for a reader who wants to know what happened and why.

---

## 1. The architecture that was replaced

```text
.pi/                                     ← canonical, and Pi's native layout at the same time
├── settings.json                        ← skill roots, prompt roots, packages, thinking tiers
├── config/models.yaml                   ← the model registry
├── skills/                              ← 21 skills, one registry, pi's discovery rules baked in
│   ├── code-review/
│   │   ├── SKILL.md                     ← meta-skill: severity, two passes, scope→doctor table
│   │   ├── architecture-doctor/         ┐
│   │   ├── backend-doctor/              │
│   │   ├── boundary-doctor/             │ 9 per-rule skills, each with its own frontmatter,
│   │   ├── i18n-doctor/                 │ its own copy of surrounding doctrine, and no
│   │   ├── react-doctor/                │ defined canonical owner for any rule
│   │   ├── style-doctor/                │
│   │   ├── test-doctor/                 │
│   │   ├── typecheck-doctor/            │
│   │   └── typescript-doctor/           ┘
│   ├── frontend-patterns/  backend/  typescript/  testing-standards/  writing-standards/
│   ├── architecture-design/  principles/  task-classification/
│   └── agent-creator/  skill-creator/  harness-validator/
├── policies/                            ← 4 cross-workflow rule files
├── workflows/                           ← 10 slash-command prompts, flat
└── agents/                              ← 9 agent files, nested by role
    ├── orchestrator/
    ├── planning/{scout,architect,oracle}/
    ├── implementation/{frontend-dev,backend-dev}/
    └── verification/{tester,reviewer,browser-verifier}/
```

Three things were wrong with it, and none of them was "the directory looks untidy".

1. **The canonical source was a product's native layout.** Pi's skill loader stops recursing at any
   directory holding a `SKILL.md`, so the nine doctors nested under `code-review/` each needed an
   explicit entry in `settings.json`. Pi's prompt loader scans one directory and does not descend. Pi's
   frontmatter field names — `systemPromptMode`, `inheritProjectContext`, `defaultContext`,
   `allowedAgents`, `allowNestedSubagents`, `maxSubagentDepth` — appeared in every agent file. A
   repository's source of truth cannot be shaped by one product's discovery rules.
2. **Nine review "skills" were four different kinds of object.** `react-doctor` was an external
   executable plus project rules. `typecheck-doctor` was a command. `typescript-doctor` and
   `style-doctor` were standards. `architecture-doctor` and `boundary-doctor` were one review
   dimension split in two, each holding a copy of the same architecture knowledge. Keeping them as nine
   peers meant nine copies of the surrounding doctrine and no answer to "who owns this rule".
3. **Classification was stated twice.** Every agent body declared `**Role:**` / `**Domain:**`, and the
   containing directory said the same thing. The two had to be kept in sync by hand, and `pi-check`
   existed partly to enforce that they had not drifted.

---

## 2. Target architecture (after)

```text
harness-core/                            ← canonical, provider-neutral
├── README.md                            ← the map
├── ARCHITECTURE.md                      ← the invariants
├── capabilities/                        ← cohesive bundles; the directory is the classification
│   ├── orchestration/            agents/{orchestrator,scout}   skills/{principles,task-classification}
│   ├── architecture-planning/   agents/{architect,oracle}      skills/architecture-design
│   ├── frontend-development/    agents/frontend-developer      skills/{frontend-patterns,react-doctor,testing-frontend}
│   ├── backend-development/     agents/backend-developer       skills/{backend,backend-testing}
│   ├── testing/                 agents/tester                  skills/testing-standards
│   ├── code-review/             agents/reviewer                skills/code-review
│   ├── browser-verification/    agents/browser-verifier        skills/browser-verification
│   ├── development-foundations/                              skills/{typescript,writing-standards}
│   └── harness-maintenance/                                  skills/{agent-authoring,skill-authoring,harness-validation}
├── workflows/                           ← 11 workflows + patterns/
├── rules/                               ← 4 cross-workflow invariants
├── config/model-policy.yaml             ← abstract tiers only
├── adapters/
│   ├── pi/{generate.mjs,validate.mjs}   ← the one implemented runtime
│   └── (codex, claude-code, cursor)     ← not created; deliberately
└── validation/{validate-core,validate-generated,check-links}.mjs

.pi/                                     ← generated, disposable, deletable
```

Nine capability bundles, nine agents, sixteen skills, twelve workflows plus one pattern, four rules.

---

## 3. Mapping — old path → new path

### Agents — old → new

| Before                                               | After                                                            | Action             |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ------------------ |
| `.pi/agents/orchestrator/orchestrator.agent.md`      | `capabilities/orchestration/agents/orchestrator.md`              | rewritten          |
| `.pi/agents/planning/scout/scout.agent.md`           | `capabilities/orchestration/agents/scout.md`                     | rewritten          |
| `.pi/agents/planning/architect/architect.agent.md`   | `capabilities/architecture-planning/agents/architect.md`         | rewritten          |
| `.pi/agents/planning/oracle/oracle.agent.md`         | `capabilities/architecture-planning/agents/oracle.md`            | rewritten          |
| `.pi/agents/implementation/frontend-dev/…`           | `capabilities/frontend-development/agents/frontend-developer.md` | rewritten, renamed |
| `.pi/agents/implementation/backend-dev/…`            | `capabilities/backend-development/agents/backend-developer.md`   | rewritten, renamed |
| `.pi/agents/verification/tester/tester.agent.md`     | `capabilities/testing/agents/tester.md`                          | rewritten          |
| `.pi/agents/verification/reviewer/reviewer.agent.md` | `capabilities/code-review/agents/reviewer.md`                    | rewritten          |
| `.pi/agents/verification/browser-verifier/…`         | `capabilities/browser-verification/agents/browser-verifier.md`   | rewritten          |

Every agent lost: the Pi frontmatter fields, the `**Role:**` / `**Domain:**` line, and every Pi tool and
permission name. Every agent gained: `modelTier`, `authority`, a neutral `tools` vocabulary, and an
explicit verification-responsibility section.

Two agents were renamed (`frontend-dev` → `frontend-developer`, `backend-dev` → `backend-developer`) so
the canonical name matches the file, the grant, the dispatch table, and the model policy. A rename is
silent in every runtime this harness supports — a dispatch to the old name resolves to nothing and only
loses the methodology — so the rename and every reference to it landed together.

### Skills — old → new

| Before                                                                | After                                                                          | Action                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| `.pi/skills/principles`                                               | `capabilities/orchestration/skills/principles`                                 | migrated, 5 references rewritten            |
| `.pi/skills/task-classification`                                      | `capabilities/orchestration/skills/task-classification`                        | simplified                                  |
| `.pi/skills/architecture-design`                                      | `capabilities/architecture-planning/skills/architecture-design`                | migrated                                    |
| `.pi/skills/frontend-patterns`                                        | `capabilities/frontend-development/skills/frontend-patterns`                   | migrated, 8 references kept                 |
| `.pi/skills/backend`                                                  | `capabilities/backend-development/skills/backend`                              | migrated + extended                         |
| `.pi/skills/typescript`                                               | `capabilities/development-foundations/skills/typescript`                       | migrated + extended                         |
| `.pi/skills/writing-standards`                                        | `capabilities/development-foundations/skills/writing-standards`                | migrated                                    |
| `.pi/skills/testing-standards`                                        | `capabilities/testing/skills/testing-standards`                                | migrated, 3 references re-homed             |
| `.pi/skills/code-review/i18n-doctor/scripts/check-locale-parity.mjs`  | `capabilities/frontend-development/skills/frontend-patterns/scripts/`          | moved to the rule's owner                   |
| `.pi/skills/agent-creator`                                            | `capabilities/harness-maintenance/skills/agent-authoring`                      | rewritten                                   |
| `.pi/skills/skill-creator`                                            | `capabilities/harness-maintenance/skills/harness-validation`→`skill-authoring` | rewritten, renamed                          |
| `.pi/skills/harness-validator`                                        | `capabilities/harness-maintenance/skills/harness-validation`                   | rewritten                                   |
| `.pi/skills/code-review/react-doctor/SKILL.md`                        | `capabilities/frontend-development/skills/react-doctor/SKILL.md`               | **split** — see below                       |
| `.pi/skills/code-review/react-doctor/references/cli-reference.md`     | same, `references/cli-reference.md`                                            | migrated verbatim + retitled                |
| `.pi/skills/testing-standards/references/frontend-component-tests.md` | `capabilities/frontend-development/skills/testing-frontend/references/`        | moved to the skill that owns frontend tests |
| `.pi/skills/testing-standards/references/browser-verification.md`     | `capabilities/browser-verification/skills/browser-verification/references/`    | moved to the skill that owns browser runs   |

Four skills are new: `react-doctor` (tool integration), `testing-frontend`, `backend-testing`,
`browser-verification`.

Two of those re-home content that had been split across bundles: frontend component tests and browser
driving are now owned by the capability that owns the work, while `testing-standards` keeps the
cross-stack methodology. Nothing is stated twice.

### The nine doctors, semantically eliminated

This is the part of the migration that is not a move.

| Retired skill                | What it was                                                     | Where its knowledge went                                                                                             | Where its detection went                                 |
| ---------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `architecture-doctor`        | one half of architecture review                                 | `architecture-design/references/boundaries.md` (canonical architecture knowledge, now referenced rather than copied) | `code-review/references/architecture.md`                 |
| `boundary-doctor`            | the other half of the same review, with a duplicated copy of it | merged into `boundaries.md`                                                                                          | merged into `code-review/references/architecture.md`     |
| `backend-doctor`             | two coding rules (`console.log`, `any`)                         | `backend/SKILL.md` (the logger rule was already there; the `any` rule joined the TypeScript skill's)                 | `code-review/references/backend.md`                      |
| `typescript-doctor`          | eight type rules plus the commands that find them               | `typescript/SKILL.md` (the rules)                                                                                    | `code-review/references/typescript.md` (T1–T8 detection) |
| `style-doctor`               | design-token rules plus their commands                          | `frontend-patterns/references/styling.md` (merged with its `best-practices.md`)                                      | `code-review/references/frontend.md`                     |
| `i18n-doctor`                | i18n rules plus their commands                                  | `frontend-patterns/references/i18n.md` (plus the parity script)                                                      | `code-review/references/frontend.md`                     |
| `test-doctor`                | test-completeness rules plus their commands                     | `testing-standards` (the methodology)                                                                                | `code-review/references/testing.md`                      |
| `typecheck-doctor`           | a command                                                       | nothing — it was never knowledge                                                                                     | `rules/verification.md`; run by `run-project-checks.mjs` |
| `react-doctor` (as a doctor) | an external CLI plus six project greps                          | `react-doctor` skill (the CLI) + `frontend-patterns` references (the greps' rules)                                   | `code-review/references/frontend.md`                     |

The rule that decided each split:

> The **implementation** rule lives in the skill that owns the domain. The **detection** rule — the
> command and how to judge a violation — lives in the review dimension that owns the check. A **script**
> executes a rule and never restates one.

So `run-project-checks.mjs` now carries the ~20 commands that were scattered across nine `SKILL.md`
files, each tagged with the review reference that owns its rule. No project architecture moved into the
script: every check names the reference, and the severity lives in the protocol.

### Workflows — old → new

| Before                                 | After                                      | Action                                                                                                                                     |
| -------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `.pi/workflows/feature-development.md` | `workflows/feature-development.md`         | migrated                                                                                                                                   |
| `.pi/workflows/bug-fix.md`             | `workflows/bug-fix.md`                     | migrated                                                                                                                                   |
| `.pi/workflows/refactoring.md`         | `workflows/refactoring.md`                 | migrated                                                                                                                                   |
| `.pi/workflows/architecture-change.md` | `workflows/architecture-change.md`         | migrated                                                                                                                                   |
| `.pi/workflows/investigation.md`       | `workflows/investigation.md`               | migrated                                                                                                                                   |
| `.pi/workflows/perf-issue.md`          | `workflows/performance-issue.md`           | renamed — a performance **issue** is a workflow; a performance **dimension** is a review question, and one name for both was the confusion |
| `.pi/workflows/design-decision.md`     | `workflows/design-decision.md`             | migrated                                                                                                                                   |
| `.pi/workflows/handoff.md`             | `workflows/handoff.md`                     | migrated                                                                                                                                   |
| `.pi/workflows/harness-process.md`     | `workflows/harness-process.md`             | rewritten — routing and coordination rules only                                                                                            |
| `.pi/workflows/parallel-execution.md`  | `workflows/patterns/parallel-execution.md` | moved — it is a workflow **pattern**, never a task type                                                                                    |
| —                                      | `workflows/code-review.md`                 | **new**                                                                                                                                    |
| —                                      | `workflows/harness-change.md`              | **new**                                                                                                                                    |

### Rules, configuration, validation — old → new

| Before                                | After                                                       | Action                                            |
| ------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `.pi/policies/verification-policy.md` | `rules/verification.md`                                     | migrated                                          |
| `.pi/policies/failure-policy.md`      | `rules/failure.md`                                          | migrated                                          |
| `.pi/policies/contract-policy.md`     | `rules/contract.md`                                         | migrated                                          |
| `.pi/policies/human-gate-policy.md`   | `rules/human-gates.md`                                      | migrated                                          |
| `.pi/config/models.yaml`              | `config/model-policy.yaml` + `config/model-policy.mjs`      | migrated; the reader moved with the file it reads |
| `.pi/settings.json`                   | `.pi/settings.json`                                         | **generated only**                                |
| `scripts/check-pi-harness.mjs`        | `validation/validate-core.mjs` + `adapters/pi/validate.mjs` | split by runtime-neutrality                       |
| `scripts/sync-model-tiers.mjs`        | `adapters/pi/generate.mjs`                                  | replaced                                          |
| `scripts/check-md-links.mjs`          | `validation/check-links.mjs`                                | migrated, scope widened                           |
| `scripts/lib/model-registry.mjs`      | `config/model-policy.mjs`                                   | migrated                                          |
| `.pi/README.md`                       | `harness-core/README.md` + a generated `.pi/README.md`      | split                                             |
| `AGENTS.md`                           | `AGENTS.md`                                                 | rewritten as a map                                |

---

## 4. Deleted concepts

### `roles/`

The old agents carried a `**Role:**` line (`coordination`, `planning`, `implementation`, `verification`)
and the containing directory repeated it. The role was a second classification parallel to the
directory tree, kept in sync by hand and enforced by a validator.

It is replaced by the **capability directory**. `capabilities/code-review/agents/reviewer.md` already
says the reviewer belongs to code review. A role line adds nothing a reader does not already have, and
it is a second thing to forget to update. `validate-core.mjs` now fails on a `**Role:**` or
`**Domain:**` line in an agent body.

The _contents_ of the role vocabulary were not lost — they were re-expressed as properties that can be
checked: `authority: read-only` (a verification agent cannot write), `tools: [dispatch]` (exactly one
agent may dispatch), and the capability path (which bundle owns it).

### `schemas/`

There is no `handoff.schema.json`, no `agent-result.schema.json`, no `workflow-state.schema.json`, and
no "PawHaven Agent Protocol".

Agent communication is a runtime concern. Pi dispatches through a `subagent` tool with its own payload;
another runtime dispatches differently. A JSON schema here would be a contract no runtime reads, and the
fields would drift from what each runtime actually passes.

What the canonical source states instead is a **semantic expectation**, in prose: the reviewer must
receive the relevant diff and the review target; the reviewer is the only verdict producer; a result
names what changed, what was verified, and what was deliberately left alone. Prose is the only form
every runtime can read.

### Doctor-per-rule

Nine skills, one per rule family. Each was separately loadable, each carried its own frontmatter and
its own copy of the severity and doctrine around it, and together they held several copies of the same
rule:

- architecture knowledge appeared in `architecture-doctor`, `boundary-doctor`, **and**
  `architecture-design/references/boundaries.md`
- type rules appeared in `typescript-doctor` **and** `typescript/SKILL.md`
- token rules appeared in `style-doctor`, `style-doctor/references/best-practices.md`, **and**
  `frontend-patterns/references/styling.md`
- test conventions appeared in `test-doctor` **and** `testing-standards`

Every one of those is a rule with two owners, which is a rule stated wrong in one place. The cost was
also paid at load time: `settings.json` had to list nine nested paths explicitly, because Pi stops
recursing at a directory holding a `SKILL.md`.

The replacement follows the shape a review actually has — **one reviewer, several dimensions**:

```text
reviewer agent  →  code-review skill  →  review dimension reference  →  the implementation rule it checks
                                    →  deterministic check            →  a finding with a severity
```

Eight dimensions: code quality, architecture, frontend, backend, TypeScript, testing, security,
performance. Four are always applicable; the rest follow the change's scope. Each dimension reference
names the skill that owns the rules it checks and **links** to it — the implementation rule is stated
once, and the reference says how a reviewer detects a violation of it.

Two dimensions are new. **Security** was entirely absent from the old harness and is now a first-class
dimension with `BLOCKING` for every finding. **Performance** existed only as a workflow; the review
dimension that asks "is this change cheap?" is now separate from the investigation that measures a
known bottleneck.

This is the same move `wshobson/agents` made: `agent-teams/team-reviewer` is one reviewer parameterised
by a **dimension**, not one skill per rule. It differs deliberately in one respect — PawHaven keeps a
single reviewer today, because nine permanent dimension reviewers would be nine permanent contexts to
maintain, and the dimensions compose inside one agent just as well.

---

## 5. Code review redesign

```text
BEFORE — one agent, nine peers, no owner for any rule
──────────────────────────────────────────────────────
reviewer (skills: code-review, principles, react-doctor, harness-validator)
   │
   └── code-review/SKILL.md          severity · two passes · scope→doctor table
         ├── architecture-doctor   ┐
         ├── boundary-doctor       │
         ├── backend-doctor        │  9 SKILL.md files, each independently loadable,
         ├── i18n-doctor           │  each carrying its own copy of the doctrine,
         ├── react-doctor          │  each listing the rules that another file also
         ├── style-doctor          │  listed
         ├── test-doctor           │
         ├── typecheck-doctor      │
         └── typescript-doctor     ┘

AFTER — one agent, one method, eight dimensions, one owner per rule
──────────────────────────────────────────────────────────────────
reviewer (skills: code-review, principles)
   │
   └── code-review/SKILL.md          what review is · dimension selection · check execution
         │                           · finding classification · verdict
         ├── references/review-protocol.md   order · severity · evidence · independence · verdict rule
         ├── references/code-quality.md      complexity · duplication · dead code · error handling · abstraction
         ├── references/architecture.md      ← merged architecture-doctor + boundary-doctor
         ├── references/frontend.md          React · components · state · data · forms · styling · i18n · a11y
         │                                       + the React gate + the project greps
         ├── references/backend.md           modules · controller/service · validation · auth · Prisma
         ├── references/typescript.md        T1–T8 detection
         ├── references/testing.md           ← test-doctor's content, as a dimension
         ├── references/security.md          NEW — the trust model and what breaks it
         ├── references/performance.md       NEW — cost visible in the diff
         └── scripts/
               ├── detect-review-scope.mjs    resolve the diff → packages → applicable dimensions
               └── run-project-checks.mjs     run the deterministic checks → findings with severities

                 └── each check names the reference that OWNS its rule
```

What is unchanged, deliberately: the reviewer is still the **sole verdict producer**, still does not
fix what it reviews, and the autonomy model (classification → plan → human approval → implementation →
self-test → independent verification → independent review → combined-tree verification → human final
review) is byte-for-byte the same. This change moved **ownership**. It did not redesign the process.

One ambiguity was resolved rather than carried forward. The old harness had two severity
vocabularies — three levels in `code-review/SKILL.md` and four in `reviewer.agent.md` — and only one
had a stated verdict rule. The protocol now defines four with explicit effects: `BLOCKING` and `MAJOR`
fail the verdict, `MINOR` and `SUGGESTION` do not. Security findings are always `BLOCKING`.

---

## 6. Runtime boundary

```text
        CANONICAL                              GENERATED
harness-core/  ──▶  adapters/pi/generate.mjs  ──▶  .pi/
                     (the only Pi-specific          (disposable,
                      translation table)             rebuilt,
                                                      never hand-edited)
```

**Canonical states what is true. The adapter states what Pi calls it.**

| Canonical says                 | Pi adapter renders                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `authority: read-only`         | `permission: {write: deny, edit: deny}` plus no `edit`/`write` tool                                                                            |
| `tools: [read, search, shell]` | `tools: read, grep, find, ls, bash`                                                                                                            |
| `modelTier: strong`            | `subagents.agentOverrides.reviewer.thinking: high`                                                                                             |
| `skills: [a, b]`               | `skills: a, b` with `inheritSkills: false`                                                                                                     |
| —                              | `systemPromptMode`, `inheritProjectContext`, `defaultContext`, `allowedAgents`, `maxSubagentDepth` — each with a reason in the adapter's table |
| —                              | `packages: [npm:pi-subagents@0.76.0]`                                                                                                          |
| —                              | `runtimeTools: [watchdog_diff, contact_supervisor]` on the reviewer                                                                            |

**The generated tree mirrors the canonical tree directory for directory.** That is the decision worth
stating: every relative markdown link in a canonical file resolves identically in the generated copy, so
a link is either right in both or wrong in both. Rewriting links per runtime would mean the canonical
link checker and the runtime's view of the same link could disagree, and neither would know.

The tree is disposable. `rm -rf .pi/capabilities .pi/workflows .pi/rules .pi/settings.json` followed by
`pnpm harness:generate` reproduces it byte for byte, and the adapter removes the four directories a
previous layout wrote so a rename cannot leave two copies of every rule behind.

`validate-core.mjs` **must not** import anything runtime-specific — that is what lets the harness be
checked on a machine with no coding runtime installed. `adapters/pi/validate.mjs` is the only file
allowed to use Pi's own loaders, and it is where they live.

---

## 7. Validation

| Check                          | Proves                                                                                                                                                                                                                                                                                                                                                       | Runtime needed |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| `pnpm harness:check`           | no duplicate component name; no missing grant, reference, rule, or workflow; valid frontmatter; name matches file and directory; no runtime field or provider model in canonical source; no orphan skill; no illegal dependency direction; no second source of truth                                                                                         | no             |
| `pnpm harness:generate`        | rebuilds every runtime artifact from canonical source                                                                                                                                                                                                                                                                                                        | no             |
| `pnpm harness:check:generated` | the generated output matches the source byte for byte — missing, stale, and orphaned output all fail                                                                                                                                                                                                                                                         | no             |
| `pnpm pi:check`                | Pi's own `loadSkills` and `loadPromptTemplates` accept the output; every `allowedAgents` entry resolves; a read-only agent denies writes; exactly one agent dispatches; every agent has a rendered tier                                                                                                                                                      | **yes**        |
| `pnpm check:links`             | 725 relative links and anchors across `harness-core/`, `AGENTS.md`, `docs/`, and both READMEs resolve                                                                                                                                                                                                                                                        | no             |
| `pnpm pi:smoke`                | 13 runtime-wiring checks: every canonical skill and workflow prompt is discoverable, all 9 agents are found, every one of the 23 skill grants resolves in Pi's catalog, the coordinator reaches all 8 siblings, only the two implementation agents hold write tools, every read-only agent denies writes, the model policy landed, and no doctor skill loads | **yes**        |
| `pnpm harness:verify`          | all five, in the order that reports a real cause first                                                                                                                                                                                                                                                                                                       | yes            |

The layering is the point. A missing file fails the canonical check, the generated check, **and** the
loader; reading the first failure is what tells you the cause, and reading the last one wastes the
change.

**The smoke test earned its place immediately.** It found two generation bugs that every other check
passed:

1. **Every generated agent had an empty description.** The canonical agents use a YAML folded block
   scalar (`description: >` followed by indented lines); the generator's frontmatter reader took the
   indicator and dropped the body, so it wrote `description: >`. Pi loaded all nine agents without a
   diagnostic. An agent whose description is empty is an agent nothing can choose.
2. **The coordinator could not reach two of its siblings.** `allowedAgents` was computed while
   rendering, so it depended on directory sort order — `orchestrator.md` sorts before `scout.md` in
   the same directory, and `scout` and `tester` were silently dropped from the dispatch list. A
   dispatch to a name that resolves to nothing falls back to a default agent.

Neither was visible to the loader check, because both produced files that load cleanly. That is the
whole argument for a check that asks "does this _work_" rather than "does this _parse_".

Round-trip proof is part of the contract: the generated tree can be deleted and rebuilt, and the
rebuilt tree is byte-identical.

---

## 8. Final source-of-truth table

| Concern       | Canonical source                        | Runtime output                                                      |
| ------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Agent         | `harness-core/capabilities/**/agents`   | `.pi/capabilities/**/agents`                                        |
| Skill         | `harness-core/capabilities/**/skills`   | `.pi/capabilities/**/skills`                                        |
| Workflow      | `harness-core/workflows`                | `.pi/workflows` (flat, because Pi's prompt loader does not descend) |
| Rule          | `harness-core/rules`                    | `.pi/rules`, consumed by workflow, agent, and runtime               |
| Model tier    | `harness-core/config/model-policy.yaml` | `subagents.agentOverrides` in `.pi/settings.json`                   |
| Project facts | `docs/`                                 | none                                                                |
| Adapter       | `harness-core/adapters`                 | runtime-specific configuration                                      |
| Validation    | `harness-core/validation`               | CI/local commands                                                   |

Exactly one canonical source per row. `validate-core.mjs` fails if a second one appears.

---

## 9. What this change deliberately did not do

- **No change to the autonomy model.** Classification, the human plan gate, the 3-cycle fix loop,
  `CONTRACT_CHANGE_REQUIRED`, wrong-plan → planning, and the combined-tree check are unchanged. This
  change moved their ownership, not their meaning.
- **No new abstraction layer.** No `commands/`, no `schemas/`, no plugin marketplace, no `roles/`. Each
  was considered and rejected against a real requirement, not on principle.
- **No fake adapters.** `adapters/README.md` records Codex, Claude Code, and Cursor as
  architecture-ready and unimplemented. An empty directory named after an unimplemented runtime is a
  promise a reader will believe.
- **No project architecture moved into the harness.** The module list, the token files, and the export
  surface stay in `docs/`. A harness that restates them drifts from them, invisibly, because the stale
  copy stays plausible.
- **No per-capability README.** Nine READMEs stating the same nine things would be nine documents to
  keep in sync for no reader who wants one map.

# Harness architecture

The invariants this harness defends, and why each one exists. This is the architecture diagram, not an
implementation guide: the procedure for changing the harness is
[workflows/harness-change.md](./workflows/harness-change.md), and the map is
[README.md](./README.md).

```text
                       harness-core
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
     plugins            workflows              rules
        │
   ┌────┼──────┬────────┬────────┬────────┬─────────┐
   │    │      │        │        │        │         │
orchestration … frontend-… backend-… testing code-review browser-
                 development development          verification

                            │
                            ▼
                         adapters
                            │
             ┌──────────────┼─────────────┐
             │              │             │
           Pi          (future)       (future)

                            │
                            ▼
                           .pi/
```

## 1. Single source of truth

Every agent, skill, workflow, rule, and model tier is defined exactly once, under `harness-core/`.

**Why:** the failure this prevents is two copies of a rule, one of which is stale, with nothing saying
which. Every other invariant below is downstream of this one.

**Enforced by:** `validation/validate-core.mjs` — duplicate component names, a second source-of-truth
reference, and a generated directory named as an authority all fail.

## 2. Plugin ownership

Work is grouped by **cohesive purpose** under `plugins/<name>/`, and a plugin holds `agents/`, `skills/`,
and optionally `commands/`. The directory is the classification; nothing inside an agent repeats it.

**Why:** grouping by technology (`frontend/`, `backend/`) puts unrelated responsibilities in one
bucket and splits a cohesive capability across two. A plugin is chosen because its parts serve one
purpose, not because they share a directory prefix.

**What is deliberately absent:** `roles/`. A second classification parallel to the plugin tree is a
second thing to keep in sync, and it disagrees silently.

**Enforced by:** `validate-core.mjs` — a plugin holding anything other than `agents/`, `skills/`, and
optionally `commands/` fails.

## 3. Agent, skill, workflow, and rule are different things

```text
Plugin  = a cohesive area of work
Agent   = an expert responsibility with its own context, tools, and authority
Skill   = reusable, focused capability or knowledge
Workflow = a sequence: what happens, in what order
Rule    = an invariant that survives across workflows
```

They compose one way:

```text
workflow → agent → skill → reference / script / asset
```

A rule may be referenced by any of workflow, agent, skill, or validator, because a rule is
cross-cutting by definition.

**Why the distinctions matter:**

- A skill that routed work to an agent, or started a workflow, would put the process in two places.
- An agent that carried a skill's rules would put a rule in two places.
- A rule inside a workflow would stop applying the moment a second workflow needed it.

**Enforced by:** `validate-core.mjs` — a skill linking into a workflow or at an agent fails with an
`ARCHITECTURE_VIOLATION` prefix.

## 4. One rule, one canonical owner

Every rule has exactly one owner. Everything else **points at** it.

The rule that decides which side owns what:

> The **implementation** rule lives in the skill that owns the domain. The **detection** rule — the
> command, and how to judge a violation — lives in the review dimension that owns the check.

So "all user-visible text goes through the translation function" is owned by the frontend i18n
reference, and the frontend review dimension says only that a reviewer must inspect that rule. A
**script** executes a rule and never restates one.

**Why:** a rule stated twice is stated wrong once, and nothing in the tree can tell you which copy is
authoritative.

**Enforced by:** review — and by `skill-authoring`, which makes finding the owner the first step.

## 5. Model policy is an abstract tier

An agent declares `modelTier`. The policy resolves the tier to a thinking level and a model, and **no
canonical file names a provider or a model identifier.**

**Why:** a provider identifier in canonical source is a policy that has leaked into an adapter. The
moment a second runtime exists, that line is wrong for one of them, and the mistake is invisible until
a task runs at the wrong intelligence level.

**Enforced by:** `validate-core.mjs` — a provider or model name anywhere in canonical source fails.

## 6. The runtime adapter boundary

Canonical source is **runtime-neutral**. An adapter translates canonical semantics into one runtime's
native layout: frontmatter field names, tool identifiers, the permission model, dispatch
configuration, package lists, and the tier-to-model mapping.

This is a **translation**, not a mirror. The canonical tree (plugin / agent / skill / workflow / rule)
is _not_ shaped like what Pi loads (agents / skills / prompts / settings.json). The adapter performs the
mapping — for example a canonical agent at `plugins/<plugin>/agents/<name>.md` becomes a Pi agent at
`.pi/agents/<plugin>__<name>.md` (the one projection, rendered into Pi frontmatter), and a canonical workflow is
referenced as a Pi prompt via `settings.json`. Everything else is referenced, not copied: a build that
mirrored the canonical tree into `.pi/` would force Pi's constraints back into canonical source.

**Why:** every runtime fact in canonical source means a second runtime requires rewriting nine agents,
and the fields nobody could translate would get smuggled into prose instead of being honestly dropped.

**What an adapter may not do:** claim support it does not have. An adapter that cannot express a
capability records it as unsupported and says what was lost. An empty directory named after an
unimplemented adapter is a lie a reader believes.

**Currently:** [Pi](./adapters/pi) is implemented. No other adapter exists, and none is faked.

## 7. The runtime is a reference, not a build

The Pi runtime reads `harness-core/` directly through `.pi/settings.json`. Skills, prompts, and rules are
referenced; none of them is copied into `.pi/`. Only `.pi/agents/` is a projection — a rendered copy (Pi
frontmatter, body kept) Pi
needs because it can only discover agents from there — and it is disposable and rebuilt by `pnpm pi:sync`.

**Why reference, not generate:** Pi discovers skills and prompts from a directory path, and `harness-core/`
already has the right shape. Copying it into `.pi/` creates a second copy that silently drifts. Rules are
not a Pi concept, so they are injected as system-prompt context by an extension, again without
duplication. There is nothing to rebuild except the agent projection.

**Enforced by:** `validation/validate-runtime.mjs` — a materialized copy of skills, prompts, or rules
under `.pi/` fails (it is a second source of truth), and `.pi/agents/` must be byte-identical to
canonical.

## 8. Validation is mechanical and layered

| Layer                | Proves                                                                                                | Needs a runtime |
| -------------------- | ----------------------------------------------------------------------------------------------------- | --------------- |
| `validate-core`      | the canonical source is internally correct and provider-neutral, and the retired architecture is gone | no              |
| `validate-runtime`   | `.pi/` is a faithful thin adapter: references resolve, no copy exists, agent bridge matches canonical | no              |
| `<runtime>/validate` | that runtime's own loader accepts the referenced resources                                            | yes             |
| `check-links`        | every relative link and anchor resolves                                                               | no              |
| `<runtime>/smoke`    | the runtime wires it together: grants resolve, dispatch reaches, tiers applied                        | yes             |

**Why the layering:** most harness defects are invisible to every check except one. A dangling grant,
a stale generated file, and a loader that rejects a skill each fail differently, and a single combined
check reports the last failure rather than the first cause.

The loader check and the smoke test are different questions. _Can the runtime read this?_ and _does
reading it produce a working harness?_ The second is not academic: it is what caught a generator that
emitted `description: >` — an agent that loads perfectly and can never be chosen, because the one
sentence a reader uses to pick it was empty.

## 9. Project documentation is separate

`docs/` holds PawHaven facts. `harness-core/` holds the development system. Neither restates the other.

**Why:** a harness that restates the module list drifts from it, and the drift is invisible because the
stale copy is plausible.

**Direction:** a skill or a rule may point at a project document. A project document never holds
harness architecture.

## 10. No runtime-specific syntax in canonical source

Canonical agents carry a closed, runtime-neutral vocabulary:

| Field       | Values                                                 |
| ----------- | ------------------------------------------------------ |
| `authority` | `read-only` or `write`                                 |
| `modelTier` | a tier that exists in the model policy                 |
| `skills`    | skill names                                            |
| `tools`     | `read`, `search`, `shell`, `edit`, `write`, `dispatch` |

Anything naming a runtime's field name, tool identifier, permission syntax, configuration file, or
dispatch mechanism belongs in an adapter. An agent's body describes **what** it is responsible for;
it never describes how a runtime calls a subagent.

**Why:** this is the invariant that makes a second runtime possible at all. Without it, adding Codex or
Claude Code is a rewrite of the harness rather than a new adapter.

**Enforced by:** `validate-core.mjs` — a runtime field in canonical agent frontmatter fails, and the
runtime validation lives only in the adapter that owns it.

## The three models this replaces

**Doctor-per-rule.** Nine separately-loadable skills, one per rule family, each with its own copy of
the surrounding doctrine and no defined owner. The replacement is one review plugin with named
dimensions: a **dimension** is a question asked of a change, its reference is how to ask it, and the
rule it checks stays owned by the skill that owns the domain.

**Role and domain in agent bodies.** A second classification parallel to the directory tree. The
replacement is the plugin directory, which already says it.

**`.pi/` as canonical source.** A runtime's native layout cannot be a repository's source of truth: its
loader stops recursing at any directory holding a `SKILL.md`, its prompt loader scans one directory and
does not descend, and its field names belong to one product. Those are adapter facts. The replacement
is canonical source plus an adapter that translates it.

## What is not an abstraction here

There is no communication schema, no state machine, no workflow engine, and no agent protocol. Agent
communication belongs to the runtime. What the canonical source states is a **semantic expectation** —
a reviewer must receive the relevant diff, a verdict must name its evidence — in prose, because prose is
what every runtime can read.

# Harness validation

The mechanical proof that the harness is internally correct. Five checks, each answering a different
question, because most harness defects are invisible to every check but one.

```bash
node harness-core/validation/validate-core.mjs       # canonical source
node harness-core/validation/validate-generated.mjs  # generated output is current
node harness-core/validation/check-links.mjs         # links and anchors
node harness-core/adapters/pi/validate.mjs           # the Pi loader accepts it
node harness-core/adapters/pi/smoke.mjs              # the Pi runtime wires it together in practice
```

## Why five, in this order

A single combined check reports its **last** failure, not its first cause. A missing file fails the
canonical check, the generated check, and the loader; fixing the source fixes all three, and chasing
the last one wastes the change.

Read the **first** failure.

| Layer                 | Question it answers                                                                           | Needs a runtime |
| --------------------- | --------------------------------------------------------------------------------------------- | --------------- |
| `validate-core`       | Is the canonical source internally correct and provider-neutral?                              | no              |
| `validate-generated`  | Does the generated output still match the source?                                             | no              |
| `check-links`         | Does every relative link and anchor resolve?                                                  | no              |
| `adapters/*/validate` | Will the runtime's own loader accept what was generated?                                      | yes             |
| `adapters/*/smoke`    | Does the runtime actually wire it together — grants resolve, dispatch reaches, tiers applied? | yes             |

The loader check and the smoke test are not redundant. `validate` asks "can the runtime read this?";
`smoke` asks "does reading it produce a working harness?" The smoke test is what caught a generator
that emitted `description: >` — an agent that loads perfectly and can never be chosen, because the
sentence a reader uses to pick it was empty.

**The app linter is deliberately not one of these layers.** `.eslintignore` excludes `harness-core/`
and `.pi/` for the same reason it already excluded `scripts/`: the rules in `libs/eslint-config` are
written for application source, and one that forbids `for…of` has nothing to say about a CLI script
that walks a directory tree. Worse, `--fix` applied to generated output would edit it and turn a
correct tree into a drifting one. Harness correctness is proved by the five checks above; nothing here
depends on a stylistic linter passing.

## `validate-core.mjs`

Canonical only. It imports the model-policy reader — which reads a YAML file in this repository and
knows nothing about any runtime — and **nothing else**. It must stay importable on a machine with no
coding runtime installed; if it ever needs a runtime's loader, that check belongs in that runtime's
adapter.

What it fails on:

- a duplicate agent, skill, or workflow name
- a missing grant, reference, rule, or workflow
- frontmatter that is missing, invalid, or disagrees with its file or directory name
- a skill directory holding something other than `SKILL.md`, `references/`, `scripts/`, `assets/`
- a file under `references/` or `scripts/` that nothing in `SKILL.md` names
- a plugin directory holding anything other than `agents/`, `skills/`, and optionally `commands/`
- a runtime-specific field inside canonical agent frontmatter
- a provider or model name anywhere in canonical source
- a `modelTier` that disagrees with the model policy, or an agent the policy does not cover
- a skill linking into a workflow or at an agent, or a skill that routes work to an agent
- a workflow or rule pointing into a generated runtime directory
- an orphaned skill: nothing grants it and nothing references it
- a per-rule "doctor" skill, or the retired doctor-per-rule plugin
- a `**Role:**` / `**Domain:**` line, which is a second classification the plugin directory already
  states

## `validate-generated.mjs`

Rebuilds every artifact in memory from the canonical source and compares it to what is on disk. It
imports the adapter's pure build function rather than shelling out to the generator, because a check
that is only supposed to read must not be able to leave the working tree half-written.

It fails on missing output, stale output, and output belonging to a component that no longer exists.
All three are drift, and drift is the only harness failure that looks like a pass.

## `check-links.mjs`

Resolves every relative markdown link **and every anchor** across `harness-core/`, `AGENTS.md`,
`docs/`, and both root READMEs. It skips any directory named `npm`, `node_modules`, `dist`, `build`, or
`.pi`.

`.pi/` is skipped on purpose: it is generated output, and the canonical scan already covers the same
source links. Scanning it would report each break twice and teach the reader that the count is the
problem.

**It resolves anchors the way GitHub does** — lowercase the heading, drop everything that is not a word
character, a space, or a hyphen, turn each space into a hyphen **without collapsing runs**. So
`State access — the real names` slugifies to `#state-access--the-real-names`, with a double hyphen
where the em-dash was. Do not hand-edit an anchor this check accepts.

A break that is not in its `KNOWN_BROKEN` list fails the run. The list is empty; an entry added to it is
a defect somebody has to own, and an entry that no longer matches anything is reported as stale so it
cannot go on suppressing the next break at the same site.

## The validators are the specification

When a rule is added, one of these has to learn it — otherwise it is prose that nothing enforces. When
one of these needs an exception, the exception ships with its reason next to it, because every
allowlist entry is a place the rule had to be argued for.

Loosening an expectation to turn a red run green is the failure this whole directory exists to prevent.

## Related

- How to read a failure and what to do about it:
  [harness-validation](../plugins/harness-maintenance/skills/harness-validation/SKILL.md)
- The invariants these checks defend: [ARCHITECTURE.md](../ARCHITECTURE.md)

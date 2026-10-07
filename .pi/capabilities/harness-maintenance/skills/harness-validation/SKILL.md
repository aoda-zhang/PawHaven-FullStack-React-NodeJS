---
name: harness-validation
description: >
  How to keep the harness itself correct: which command to run, when to regenerate the runtime, how
  to read a failure, and what to do about drift, a broken link, an orphan skill, and a capability a
  runtime cannot express. Load before committing any change to the harness, and whenever a check
  fails and the reason is not obvious.
  Trigger: harness check validation drift stale generated regenerate orphan broken link dangling
  grant unknown skill duplicate name model tier before commit harness change.
---

# Harness validation

The harness is configuration, and configuration fails silently. A skill named in a grant that no
longer exists does not error: the agent quietly stops seeing it, and the rule stops being applied
weeks before anyone notices. None of that is visible in a diff. These checks make it visible.

## The four commands

```bash
pnpm harness:check           # the canonical source is internally correct
pnpm harness:generate        # regenerate every runtime's output from that source
pnpm harness:check:generated # the generated output matches the source, byte for byte
pnpm check:links             # every relative link and anchor resolves
pnpm pi:check                # the runtime's own loader accepts what was generated
pnpm pi:smoke                # the runtime wires it together: grants resolve, dispatch reaches, tiers applied
```

`pnpm harness:verify` runs all of them in the order that reports a real cause first.

**Order matters when one fails.** Read the first failure, not the last. A missing file fails the
source check, the generated check, and the loader; fixing the source fixes all three, and chasing the
last one wastes the change.

## Which failure means what

| Failure                                                   | It means                                                             | Do this                                                                        |
| --------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `harness:check` names a missing reference                 | A grant, a link, or a tier name resolves to nothing                  | Fix the name, or restore what it named. Do not delete the grant to silence it. |
| `harness:check` reports a duplicate name                  | Two components answer to one name, so one of them wins invisibly     | Rename one. A duplicate is a silent loss, not a style issue.                   |
| `harness:check` reports an illegal dependency             | A skill routes work to an agent, or an agent carries a runtime field | Move the knowledge down a level, or the field into the adapter.                |
| `harness:check:generated` reports drift                   | The source changed and the output was not regenerated                | Run `pnpm harness:generate`. Never hand-edit generated output.                 |
| `pi:check` fails to load a skill or a prompt              | The runtime rejects what the generator produced                      | Fix the adapter or the canonical source. Not the generated file.               |
| `pi:smoke` reports an empty grant or an unreachable agent | The generator produced something loadable that does not work         | Fix the generator. Nothing else in the tree can see this.                      |
| `check:links` reports a broken link                       | A relative path or an anchor does not resolve                        | Fix the link. Never delete a document to make a link resolve.                  |
| `harness:check` reports an orphan component               | Nothing can reach it, so it will drift from everything that does     | Grant it, link it, or delete it. An orphan is a promise nobody keeps.          |

## Drift

Drift is the only failure that looks like a pass. The source is right, the output is stale, and
nothing is broken until the runtime reads the stale copy.

The generated check compares what the generator produces **now** against what is on disk. It needs no
runtime, so it runs before the loader check and it is the one that catches a source change nobody
regenerated.

**Generated output is disposable.** Delete it and regenerate; if it cannot be regenerated, it is not
generated output, it is a second source of truth wearing the wrong name. Never edit it by hand — the
next regeneration silently discards the edit, and the hand-edit looked reviewed.

## A capability a runtime cannot express

Some things will not survive translation: a permission model the runtime has no equivalent for, a
tool that has no counterpart, a discovery rule that only descends one directory.

When you hit one:

1. **Do not weaken the canonical source to fit the runtime.** The canonical source states what is
   true. An adapter that drops a field degrades loudly and says so.
2. **Do not fake support.** An adapter that cannot express a capability records it as unsupported.
   An empty directory named after an unimplemented adapter is a lie a reader will believe.
3. **Say so in the adapter's own documentation**, next to the field it dropped, with the consequence.

The canonical source stays runtime-neutral precisely so this is a local problem in one adapter rather
than a rewrite of every agent.

## Manual checks the scripts do not cover

One thing no script can tell you: whether the harness says the right thing. The link inventory shows
what exists, so an unexpected target is visible:

```bash
pnpm harness:check
```

and read the output as a reader would — is the description enough to make an agent load this skill, and
is the router enough to act on without opening every reference?

## Before you finish

- [ ] `harness:check` passes, and every fix is in the same change
- [ ] `harness:generate` has been run and its output is committed
- [ ] `harness:check:generated` passes — the output is current, not merely present
- [ ] `check:links` passes
- [ ] `pi:check` passes — a real runtime's loader accepts it
- [ ] `pi:smoke` passes — the runtime wires it together, not merely loads it
- [ ] The rules you touched still have exactly one canonical owner
- [ ] Nothing was hand-edited under a generated directory

A harness change is infrastructure, and infrastructure fails quietly. Every box above is a claim
something proved.

## Related

- Defining an agent: [agent-authoring](../agent-authoring/SKILL.md)
- Defining a skill: [skill-authoring](../skill-authoring/SKILL.md)
- The architecture these checks defend: [ARCHITECTURE.md](../../../../ARCHITECTURE.md)

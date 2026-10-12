---
description: Change the harness itself — canonical source, adapters, generated runtime, or validation
---

# Harness Change

You own this task. Classify, analyse, change one source, regenerate, prove, hand off.

**The harness is the system that makes every other task verifiable.** A quiet mistake in it is not a
bug in the harness; it is a rule that stops being applied to every future change, silently, until
somebody notices the absence.

## When this workflow applies

Any change to:

- canonical harness source — capabilities, workflows, rules, model policy
- a runtime adapter — the translation from canonical source to one runtime's output
- the generated runtime configuration a runtime reads at startup
- the validation that guards any of the above
- the repository map that points at the harness

A rule text that is _about_ application code is not this workflow. A rule that is about the harness is.

## Steps

1. **Classify it.** Run the classification skill and publish the artifact. A harness change is
   `risk: high` at minimum, whatever its diff size: it affects every future task, so a wrong one is
   paid for repeatedly and stays invisible until much later.

2. **Establish where the truth lives, before editing anything.** For the thing you are about to change,
   name the single canonical owner. If you cannot name one, that is the finding — the change is about
   _establishing_ the owner, and that is the design work. If two places state the same rule, one of
   them is already wrong; say which.

3. **Analyse the impact.** What else references this component, what depends on the property you are
   changing, and what would break at load time rather than at diff time. A rename that resolves to
   nothing is silent in every runtime this harness supports.

4. **Change one source.** Canonical source for a rule, an adapter for a runtime's shape. Never both in
   one change unless one is a mechanical consequence of the other. Never the generated output: if a
   generated file needs a change, the change belongs in its source, and regeneration produces it.

5. **Rebuild the agent projection.** `.pi/agents/` is the one disposable artifact: `pnpm pi:sync`
   rebuilds it from canonical agents (frontmatter rendered to Pi's format, body copied). Everything else is
   referenced directly via
   `.pi/settings.json`, so there is nothing else to regenerate. Never hand-edit the projection.

6. **Prove it, in this order.** Each step fails for a different reason and the first failure is the
   one that tells you the real cause.

   ```bash
   pnpm harness:validate       # the canonical source is internally correct
   pnpm pi:sync                # project canonical agents into .pi/agents
   pnpm harness:runtime        # .pi/ is a faithful thin adapter of the source
   pnpm check:links            # every relative link and anchor resolves
   pnpm pi:check               # a real runtime's own loader accepts the referenced resources
   pnpm pi:smoke               # the runtime wires it together: grants resolve, dispatch reaches, tiers applied
   ```

   A harness change that typechecks, packages, and passes a link check but was never loaded by the
   runtime has not been validated. The loader check is not optional, because most harness defects are
   invisible to everything else.

7. **Exercise the harness, do not only validate it.** `pi:smoke` is that exercise, and it is not
   redundant with `pi:check`: `check` asks "can the runtime read this?", `smoke` asks "does reading it
   produce a working harness?". It caught a generator that emitted `description: >` — an agent that
   loads perfectly and can never be chosen, because the sentence a reader uses to pick it was empty.
   After a change to an adapter or to an agent, read the smoke output rather than assuming it.

8. **Hand off.** A harness change gets its own reviewable change, separate from any feature work it was
   found in. State what a rule's absence would have cost, so the reviewer can weigh the risk of the
   change against the risk of leaving it.

## Rules that bind this workflow

- **Never hand-edit generated output.** Regenerate it.
- **Never fix a failing review by changing a rule.** A rule that is wrong gets fixed as its own change,
  with the reason. A rule edited to make one review pass is the harness lying to every later task.
- **Never smuggle runtime syntax into canonical source.** If a runtime needs something the canonical
  model cannot express, the adapter carries it, with the consequence documented beside it.
- **Never fake support.** An adapter that cannot express a capability records it as unsupported; an
  empty directory named after an unimplemented adapter is a lie a reader believes.
- **One canonical owner per rule.** Adding a rule means finding its owner first. Adding a second copy
  means the rule will drift and nothing will say so.

## Reply

What changed and where the truth for it lives, what referenced it, what was regenerated, the four
checks with their output, what you exercised beyond the checks, what you deliberately left alone, and
what a regression in this change would cost the next task.

---
description: Make and record an architecture or design decision from evidence
---

# Design Decision

You own this task. Decide from evidence, stay in the lead.

A design decision is an architecture, data model, or API choice with competing options. The deliverable
is a decision that traces to evidence and to the domain, not a code change.

## Steps

1. **Model the domain first.** Name the data shape and the constraints any option must satisfy, per
   [model-the-domain](../plugins/orchestration/skills/principles/references/model-the-domain.md). Write the requirements down
   before comparing options; the requirements decide, not taste.
2. **Enumerate the options.** For each real option: what it costs, what it enables, what it forbids.
   Exhaust the design space with the actual contenders; do not stop at the first workable idea.
3. **Settle empirical forks by observing.** If the choice is settled by behaviour, layout, timing, or
   output, prototype it and let the result decide. A throwaway probe hands the human a result to react
   to, which is the fast path; asking first is the slow one. Where a decision does stop for the human is
   [the human-gate rule](../rules/human-gates.md#human-gates).
4. **Check the boundaries.** For each option: where are the guards, what is trusted, what breaks — the
   API contract, i18n keys, storage, existing consumers across `apps/` and `packages/`?
   [boundary-discipline](../plugins/orchestration/skills/principles/references/boundary-discipline.md), and an option that
   strands legacy is worse than one that migrates it
   ([subtract-before-you-add](../plugins/orchestration/skills/principles/references/subtract-before-you-add.md)).
5. **Decide, and name the tradeoff you accepted.** Every decision gives something up. State what the
   losing options were and why they lost. If the decision is contested, route it through adversarial
   review with the `code-review` skill before committing.
6. **Write the decision.** If it changes the architecture or a shared contract, update
   `docs/architecture/` so future sessions inherit the reasoning. No ADR records. If the decision
   contradicts what a `docs/features/**` document claims, that document is the thing that is wrong —
   reconcile it from the decision, not the other way round.

## Reply

The decision up front, the domain model it rests on, the options considered with the tradeoff each
accepted, the evidence — including any probe results — that decided it, and what was recorded. Name the
principle that changed a decision.

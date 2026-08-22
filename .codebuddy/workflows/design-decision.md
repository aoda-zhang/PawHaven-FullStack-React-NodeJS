# Design Decision

You own this task. Decide from evidence, stay in the lead.

A design decision is an architecture, data model, or API choice with competing options. The deliverable is a decision that traces to evidence and to the domain, not a code change.

## Steps

1. **Model the domain first.** Name the data shape and the constraints that any option must satisfy, per **principle-model-the-domain**. Write the requirements down before comparing options; the requirements are what decide, not taste.
2. **Enumerate the options.** For each real option: what it costs, what it enables, what it forbids. Exhaust the design space with the actual contenders; do not stop at the first workable idea.
3. **Settle empirical forks by observing.** If the choice is settled by behavior, layout, timing, or output, prototype it and let the result decide, per **principle-never-block-on-the-human**. The ask is the slow path; a throwaway probe hands the human a result to react to.
4. **Check the boundaries.** For each option, where are the guards, what is trusted, what breaks (API contract, i18n keys, storage, existing consumers across `apps/` and `packages/`)? Per **principle-boundary-discipline** and **principle-migrate-callers-then-delete-legacy-apis**, an option that strands legacy is worse than one that migrates it.
5. **Decide, and name the tradeoff you accepted.** Every decision gives something up. State what the losing options were and why they lost. If the decision is contested or high-stakes, route it through adversarial review (`agents/code-review.md`) before committing.
6. **Write the decision.** If it changes the architecture or a shared contract, record it in `docs/` (ADR-style) so future sessions inherit the reasoning, per the documentation rule.

## Reply

The decision up front, the domain model it rests on, the options considered with the tradeoff each accepted, the evidence (including any prototype results) that decided it, and what was recorded. Name the principles that changed a decision.

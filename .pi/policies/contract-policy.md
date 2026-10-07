# Contract policy

How a boundary between two domains is agreed, expressed, and changed. One statement for every
domain pair — `frontend ↔ backend` today, and whatever pair is added next.

## What a contract is

A durable handoff artifact that describes a boundary: interface, types, inputs, outputs,
errors, auth, ownership, dependencies, and what it means for acceptance.

It is **not** an agent, not a skill, and not a subsystem. Where the boundary has a code-level
expression, that is [`packages/shared/types`](../../packages/shared/types) — the Zod schemas
and types both sides import instead of re-declaring. Reuse the artifact that already exists
rather than introducing a second system for the same job.

## Who settles it

**The plan settles the contract, before either worker starts.**

Neither implementation lane drafts it unilaterally. A contract sketched by `frontend-dev` and
finalised by `backend-dev` is a boundary that moved while nobody was looking; a contract
implied by `backend-dev` from an existing endpoint is a contract nobody agreed to. Either way
the mismatch surfaces at the end, when both lanes have already reported a self-test pass.

The plan names the contract, and `packages/shared/types` is where it lands. Each worker is
handed the contract explicitly in its dispatch prompt, and neither is assumed to have read the
other's output.

A full-stack task is therefore composed, not merged: two lanes holding the same agreed
boundary, never one lane holding both sides.

## The contract change gate

An implementation worker must not silently redefine an agreed contract. When the contract it
was handed turns out to be insufficient to build what was asked, it stops and emits:

```
CONTRACT_CHANGE_REQUIRED
```

carrying:

- the current contract
- the proposed change
- the reason
- the affected domains
- the affected files
- the risk

The failure this prevents is a boundary that moves in two directions at once. A frontend lane
quietly changes an API expectation, a backend lane quietly changes the response shape, and the
mismatch surfaces only at final verification.

## The contract change route

The rule above binds the worker that has to stop. This is the route the signal takes once it
has been emitted.

1. The orchestrator reads the signal and decides whether the proposed change is a design
   question, an evidence question, or both.
2. **Design.** `architect` for a design question.
3. **Evidence.** `oracle` establishes what the existing system actually supports in the
   proposal, before it is adopted. It is asked for the evidence the proposal assumes, not for
   a second design, and it answers that question even when the proposal is sound.
4. **Human gate.** A material change triggers it, the same way any other scope decision does.
   See [human-gate-policy](./human-gate-policy.md#what-the-human-decides).
5. **Re-synchronise.** Every affected lane is re-synchronised on the new contract before work
   continues, so no unit keeps building against the one it was handed.

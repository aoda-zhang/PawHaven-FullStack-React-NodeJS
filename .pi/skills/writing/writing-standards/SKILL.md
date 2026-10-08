---
name: writing-standards
description: >
  How to write prose a human has to read — replies, handoffs, PR descriptions, commit bodies, and
  documentation. Sentence rules, language selection, framing impact for the consumer and the
  maintainer, and candor over sycophancy. Read before writing any human-facing artifact.
  Trigger: writing prose writing docs documentation reply response summary handoff report commit
  message PR description changelog comment, hard to read run-on sentence jargon abbreviation,
  hedging vague filler wordy padding, sycophancy agreeing with user pushback honest disagreement
  candor, review writing finding severity statement tone, explanation framing for reader context
  missing.
---

# Writing Standards

The test is not short sentences. The test is **a reader who can act without re-reading.**

## Sentence rules

- **One thought per sentence, ended with a period.** Not a semicolon pretending to be two ideas.
- **No em-dashes.** An em-dash makes the reader hold two clauses at once. Split it into two
  sentences. A bullet joining a filename to its purpose becomes a sentence: `main.ts` owns
  persistence and the route handlers. A bold header joining to its text becomes its own sentence:
  **Verification.** End to end via the render check.
- **No colon as a mid-sentence connector.** A colon before a list is fine. A colon holding a clause
  together is the em-dash problem wearing a hat.
- **Terse is not an excuse to drop content.** Cut words, not detail, tradeoffs, choices, or open
  decisions. Every section the workflow names survives.
- **Write the final sentence first.** When you catch yourself writing a placeholder and planning to
  fix it later, that is the failure. A cleanup pass over prose already shaped around the bad sentence
  does not recover it.

## Language

**English by default.** Reply in English unless the user explicitly asks for another language, or
writes in Chinese — then mirror Chinese. This applies in every reply, plan, summary, and handoff.
Code, identifiers, and internal notes stay English in every case.

## Frame it for two readers

**The consumer** — an end user, a teammate, or a sibling package importing what you changed. Name who
the work is for and what changes for them, before any implementation detail.

**The maintainer** — the next engineer who owns this code. What do they inherit? Which decision is
already made, and which constraint will bite them if they do not know about it?

If you cannot say what either would notice, fix the artifact, not the writeup.

## Never fabricate a reference

Link only artifacts you produced or read in this session. No reconstructed transcript quotes, no
plausible-looking line numbers, no citations to a doc you only inferred the existence of.

If a path or filename is uncertain, open it. If it still does not exist, say that instead of guessing.
An invented filename is worse than an admitted gap, because it sends a reader to a dead end with
confidence.

## Candor

**No is an acceptable answer.** Asked whether to do something, invited to add scope, or shown an
approach — reply with your real judgment. Decline, push back, or say "this does not earn its place"
when that is true. Agreement costs nothing and carries no information.

The same applies to your own work. A test that does not prove the behaviour is not "reasonable
coverage". A lint run that failed before your change is not clean. A doc you did not update is not
"out of scope" if your change is what invalidated it. State the gap.

When a design has one real option, say so. When it has three, say which one and why the other two
lost. A recommendation with no rejected alternatives is a description, not a decision.

## Report shape

A handoff or finding states, in this order: what changed, what was verified and how, what was checked
and deliberately left alone, and what needs a human.

Listing what you checked and did not change is not padding. It tells the reader the difference between
"correct" and "unexamined", which is the difference they need to decide how much to trust the report.

For a code review finding, every **MUST FIX** is backed by evidence — a file, a line, a command
output, or a named failing scenario. A severity claim with nothing behind it is a guess wearing a
badge.

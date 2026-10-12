---
name: browser-verification
description: >
  How to drive the running PawHaven portal in a real browser: the config, the ports, the
  preconditions, and the console and network capture snippets. Read before driving any journey, and
  whenever a check cannot be done with what is already installed in this repository.
  Trigger: browser verify playwright drive portal dev server port console capture network log
  screenshot trace journey navigate click submit.
---

# Browser verification

The reference file holds the detail and is read on demand:

→ [references/browser-verification.md](./references/browser-verification.md)

Read it before driving anything. This skill exists so the loader, the ports, and the capture snippets
are paid for once instead of at every journey.

## What this is for

Proving what the **running** application did. A compile, a passing unit test, and a source file that
reads correctly are three different facts from a rendered result, and only one of them is observable
from the outside.

## The rules that matter most

- **Never install anything.** A browser driver, a test framework, a plugin. If the check cannot be
  done with what is installed, that is the answer: report it as not run, with the reason.
- **Real evidence or no pass.** A claim about what the screen did needs a screenshot, a DOM excerpt, a
  console capture, or a network log produced by that run. A paraphrase of the source is not evidence.
- **One evidence block per journey**, each naming the route, the steps, the expected result, the
  observed result, and the artifact.
- **Console errors and failed requests are findings** even when the screen looks correct. A recovered
  5xx is still a 5xx.
- **Name what you did not exercise.** An auth-gated route you never signed into, a seed row you never
  created, a service you never started — say "not verified" rather than letting silence read as
  coverage.

## What belongs in the repository

Throwaway output goes to a temporary location. A **durable** browser specification belongs in the
repository's end-to-end suite, added by the change that needs it, and never written as a side effect
of a verification run.

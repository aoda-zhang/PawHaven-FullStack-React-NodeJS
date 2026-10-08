---
name: testing-frontend
description: >
  How to write a frontend component test in PawHaven: where it lives, the per-file environment
  pragma, the DOM matchers, and the browser-API polyfills jsdom does not provide. Read before
  writing or reviewing a component test, and whenever a component test fails at initialisation
  rather than at an assertion.
  Trigger: frontend component test render testing-library jsdom polyfill matchMedia
  IntersectionObserver ResizeObserver vitest environment pragma mock ui barrel carousel embla.
---

# Frontend testing

Cross-stack test methodology — the runner, the placement rule, what a test has to earn — is
[testing-standards](../../../testing/skills/testing-standards/SKILL.md). Read that first. This skill
owns only the frontend component-test specifics.

## The three rules

1. **The environment pragma is per file.** Put `// @vitest-environment jsdom` at the top of every
   test that touches the DOM. It is not inherited from a neighbouring file.
2. **Import the DOM matchers** from their vitest entry point. The plain entry point does not register
   them.
3. **Polyfill the environment, never the subject.** jsdom implements none of `matchMedia`,
   `IntersectionObserver`, or `ResizeObserver`, so a library that reads one at init throws before your
   assertion runs. Stub the browser API. Mocking the component's own collaborators instead leaves a
   test that proves the mocks compose.

→ [references/frontend-component-tests.md](./references/frontend-component-tests.md) — a working
test file and the three polyfill stubs.

## Traps worth knowing before you hit them

- **Do not import the UI package barrel through its original module.** Pulling a component library's
  real implementation into jsdom takes its animation dependency with it, and the test dies at import
  time. Mock the barrel.
- **Do not add a lottie alias to make a test pass.** It converts one failure into a different failure
  and hides the real one. Report it instead.
- **Mocking the store or the query client is normal**; mocking the component under test is not. If
  the thing you are testing is the component, do not mock it.

## What a frontend test must earn

A frontend test earns its place by failing when the behaviour breaks. That means asserting on
something the user would notice: a rendered label, a disabled control, an error message, a call the
component made. A render with no assertion proves the module imported.

Render-only smoke tests are legitimate for one narrow case: proving a component mounts without
throwing. Say that is what the test is for, and keep it named as such.

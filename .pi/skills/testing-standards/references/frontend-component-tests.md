# Frontend component tests

The working shape behind
[testing-standards](../SKILL.md). The rules stay in that file; this holds the file they describe.

`packages/ui/src/components/carousel/tests/Carousel.test.tsx` is the reference implementation. Read it
alongside this.

## The test file

```typescript
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Carousel } from '../Carousel';
```

The `// @vitest-environment jsdom` pragma is **per-file**. It is not inherited and a config-level
default does not cover it. Put it at the top of every DOM test.

`@testing-library/jest-dom/vitest` supplies the custom matchers. Import the vitest entry point, not
the jest one, or the matchers do not register.

## The browser-API polyfills

jsdom implements **none** of `matchMedia`, `IntersectionObserver`, or `ResizeObserver`. A carousel
built on Embla reads all three during init and throws before the first assertion runs, so the test
fails for an environment reason and reads as a component bug.

Stub the **environment**, not the thing under test. A test that mocks the component's own
collaborators proves nothing about the component.

```typescript
beforeAll(() => {
  window.matchMedia = ((query: string) =>
    createMediaQueryList(query)) as typeof window.matchMedia;
  window.IntersectionObserver = function IntersectionObserverStub() {
    /* … */
  };
  window.ResizeObserver = function ResizeObserverStub() {
    /* … */
  };
});
```

The stubs must satisfy the real interface. A stub that returns `undefined` where the component
expects an entry list moves the failure rather than removing it.

## What this buys

A component test earns its place by failing when the behaviour breaks. "Which surface would it fail
on, and what would it catch?" are the two questions worth answering before writing one. The full
three-question form is in [testing-standards](../SKILL.md#what-a-test-must-earn).

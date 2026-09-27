---
name: testing-standards
description: >
  PawHaven testing standards, verified against the real codebase. The stack is vitest everywhere —
  Jest is NOT installed. Covers service tests with a hand-built Prisma double, jsdom component tests
  with browser-API polyfills, the unplugin-swc requirement in backend-core, co-location rules, and
  what the e2e harness actually covers today. Read before writing a test, deciding whether a change
  needs one, or reporting a test result.
  触发场景 / Trigger: test testing unit test integration test e2e end-to-end API test regression,
  单元测试 集成测试 接口测试 回归测试 端到端测试 覆盖率, vitest jest playwright test runner config
  jsdom testing-library render hook mock stub spy assert coverage, prisma mock test double
  fixture builder, nest testing module Test.createTestingModule dependency injection,
  test placement co-located tests directory convention, 测试策略 测试报告 QA 验证.
---

# Testing Standards

Read this before writing a test or claiming a change is verified. Every claim here was checked
against the repo — including the places where the old `.codebuddy/agents/testing.md` was wrong.

## The stack is vitest. There is no Jest.

`.codebuddy/agents/testing.md` specified **Jest with `jest.fn()`** for backend unit and integration
tests. Jest is not installed anywhere in this monorepo. Writing `jest.fn()` produces a test that
cannot run.

| Layer              | Runner     | Library                                           |
| ------------------ | ---------- | ------------------------------------------------- |
| Backend unit       | vitest     | `vi.fn()`, hand-built doubles                     |
| Backend HTTP       | vitest     | `supertest` (gateway, auth-service, backend-core) |
| Frontend component | vitest     | `@testing-library/react` + `jest-dom/vitest`      |
| Shared / packages  | vitest     | per-package `vitest.config.ts`                    |
| E2E                | playwright | `@playwright/test` — harness only, no specs yet   |

## Running tests

```bash
pnpm test                          # turbo run test — all packages
pnpm --filter @pawhaven/core-service test
pnpm --filter @pawhaven/portal test
pnpm test:e2e                      # playwright — currently collects ZERO specs
```

`@pawhaven/shared` runs `vitest run --passWithNoTests`; an empty result there is not a failure.

`playwright.config.ts` points at `./e2e` and boots `@pawhaven/portal` on `localhost:3001` via
`webServer`. **The `e2e/` directory contains no spec files**, so `pnpm test:e2e` passes by running
nothing. Do not report it as evidence.

## Where tests live

Tests are **co-located**, not in a top-level `tests/` or `__tests__/` directory:

```
src/modules/rescue/rescue.service.test.ts        # backend — beside the unit under test
src/features/rescue-detail/tests/*.test.tsx      # frontend — a tests/ dir inside the feature
packages/ui/src/components/timeline/*.test.tsx   # packages — inside the component folder
```

Backend uses `<name>.service.test.ts` beside the source. Frontend uses a `tests/` folder inside the
feature or component directory. Both conventions are established; match whichever applies.

## Backend service tests

`rescue.service.test.ts` is the reference. The shape:

1. **Import `vi` from `vitest`** — not globals, even though `packages/ui` sets `globals: true`.
2. **Build records through a factory with overridable defaults.** A literal fixture duplicated
   across cases drifts the moment a field is added.

```typescript
import { describe, expect, it, vi } from 'vitest';
import { AnimalStatus } from '@pawhaven/shared/types';
import { RescueService } from './rescue.service.js';

const RECORD_ID = 'PAW-0001';
const REPORTED_AT = new Date('2026-08-22T10:00:00.000Z');

type RecordOverrides = Record<string, unknown>;

const buildRecord = (overrides: RecordOverrides = {}) => ({
  id: RECORD_ID,
  animalType: 'cat',
  age: 'baby',
  animalStatus: AnimalStatus.PENDING,
  statusDescription: null,
  description: 'Found near the park',
  size: 'small',
  animalCount: 1,
  appearance: { color: 'black' },
  locationObj: { address: 'Central Park' },
  reporterPhotos: [],
  reporter: { reporterID: 'user-1', reporterName: null },
  createdAt: REPORTED_AT,
  deletedAt: null,
  ...overrides,
});
```

3. **Double Prisma by hand, not with a mocking library.** There is no `prisma-mock` dependency. The
   double is a `vi.fn()` per model method, wired into a fake client, and it must distinguish call
   shapes the service actually uses — note how it detects a narrow `select` lookup:

```typescript
const isPhotoLookup = (args?: { select?: Record<string, boolean> }) =>
  args?.select !== undefined && Object.keys(args.select).length === 1;
```

4. **Cover the error path explicitly.** The double accepts `Error` in place of records so the
   rejection branch is reachable:

```typescript
const buildService = (records: RecordOverrides[] | Error = []) => { … };
```

5. Assert on the **thrown `BadRequestException` / `NotFoundException`**, not on Prisma's error text —
   the service deliberately hides internals from clients.

→ [references/backend-service-tests.md](./references/backend-service-tests.md)

## Frontend component tests

`packages/ui/src/components/carousel/tests/Carousel.test.tsx` is the reference.

```typescript
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Carousel } from '../Carousel';
```

- **The `// @vitest-environment jsdom` pragma is per-file.** Put it at the top of every DOM test.
- **Import `@testing-library/jest-dom/vitest`** for the custom matchers.
- **Polyfill browser APIs; do not mock the component's dependencies.** jsdom implements none of
  `matchMedia`, `IntersectionObserver`, or `ResizeObserver`, so libraries like Embla fail at init:

```typescript
// Embla needs matchMedia + IntersectionObserver + ResizeObserver on init;
// jsdom implements none of them. Browser-API polyfills, not component mocks.
beforeAll(() => {
  window.matchMedia = ((query: string) => createMediaQueryList(query)) as typeof window.matchMedia;
  window.IntersectionObserver = function IntersectionObserverStub() { … };
  window.ResizeObserver = function ResizeObserverStub() { … };
});
```

That comment is the rule: stub the **environment**, not the thing under test. A test that mocks the
component's own collaborators proves nothing about the component.

## backend-core needs SWC

`packages/backend-core/vitest.config.ts` registers `unplugin-swc`, and the reason is load-bearing:

```typescript
// esbuild (vitest's default transformer) does not emit `design:paramtypes`, so
// NestJS cannot resolve constructor dependencies in tests. SWC does, which is
// what makes `Test.createTestingModule` usable here.
plugins: [swc.vite()],
```

If you add a NestJS DI test anywhere and `Test.createTestingModule` cannot resolve a constructor
dependency, this is why. Do not "fix" it by removing the plugin.

## What a test must earn

A test earns its place by failing when the behaviour breaks. Before writing one, be able to answer:

- **Which surface?** The original repro, on the same surface that failed. Inconclusive or
  wrong-surface is not a pass.
- **Which layer?** Unit for logic, HTTP for a contract, component for rendering and interaction.
  Do not test a service through three layers at once.
- **What would it catch?** If the answer is "nothing specific", delete it.

Never mark something verified because it compiles. See `prove-it-works` in the `principles` skill.

## Baseline

`pnpm lint` exits non-zero from **pre-existing** errors — 3 in `gateway`, 11 in `backend-core`.
Diff against baseline before attributing a failure to your change.

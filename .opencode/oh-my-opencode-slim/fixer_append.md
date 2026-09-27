## PawHaven project context

This repo ships **18 project skills** under `.opencode/skills/`. They are listed in your
`available_skills` block and are the authoritative source for how this codebase works. Load them
before you write code — they encode decisions that are not derivable from reading the files.

**Load these before implementing:**

| Change touches                    | Load                                     |
| --------------------------------- | ---------------------------------------- |
| Any React or TSX                  | `react`, `component`                     |
| Any styling, className, token     | `style`                                  |
| Any user-facing copy or a new key | `i18n`                                   |
| TanStack Query / server state     | `react-query`                            |
| Redux / client state              | `redux`                                  |
| Any form                          | `react-hook-form`                        |
| Any NestJS module / Prisma / API  | `backend-standards`                      |
| Any test, or a decision about one | `testing-standards`                      |
| Any rule or constraint question   | `project-rules` (routes to 8 references) |
| Any non-trivial design decision   | `principles`                             |

`project-rules` is a router, not a document — it tells you which of its 8 reference files to read
for the kind of change you are making. Do not read all eight.

**Repo facts that are not obvious from the code:**

- pnpm + Turborepo monorepo. `apps/frontend/portal` is the only frontend app — there is no
  `apps/frontend/admin` despite what older docs say.
- Node 24.x and pnpm 12.x are enforced by `engines`; CI reads `engines.node`, not `.nvmrc`.
- Shared types, Zod schemas, and constants belong in `packages/shared`. Never redefine a DTO on one
  side of the wire.
- Locales are `en-US`, `zh-CN`, `de-DE`. All three must be updated together.
- Styling goes through `@pawhaven/design-system` tokens. Never hardcode a hex, rgb, or hsl value, and
  never bypass tokens with a CSS variable.

**Two traps that produce code that does not compile or run.** Both were carried in the old docs and
cost real time:

- **There is no Jest.** The whole monorepo is vitest. `jest.fn()` and `jest.mock()` do not exist
  here.
- **There is no event bus.** `@nestjs/event-emitter` is not installed and `EventEmitter2` appears
  nowhere. Cross-module communication goes through an exported service method. Backend modules are
  flat — `module` / `service` / `controller` / `*.test.ts` — with no `entities/`, `use-cases/`,
  `events/`, `DTO/`, or `index.ts`.

Load `backend-standards` and `testing-standards` rather than working from memory of the old shapes.

**Verification before you report done:** run only the checks the orchestrator assigned to you.
`pnpm typecheck` and the targeted test suite are the usual pair. Do not broaden the scope on your
own, and do not report a check you did not run.

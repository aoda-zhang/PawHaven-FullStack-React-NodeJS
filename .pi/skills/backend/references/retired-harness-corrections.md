# Corrections to the retired harness notes

`.codebuddy/agents/backend.md` asserted the things below. Every one was checked against the code and
is **false**:

- Modules contain `entities/`, `use-cases/`, `events/`, `DTO/`, `index.ts` — none exist anywhere.
- A `content` module with use-case and facade patterns — no such module exists.
- `ZodValidationPipe` / `nestjs-zod` — zero references, not in any `package.json`.
- `EventEmitterModule` / `@OnEvent` event bus — zero references, not installed.
- Cross-module imports are "enforced by ESLint" — there is no such rule.
- Prisma lives at `prisma/schema.prisma` and is reached as a `PrismaClient` constructor param —
  it is MongoDB at `src/prisma/mongodb/`, injected via `@InjectPrisma`.

Do not reintroduce them. If a future change adopts an event bus or use-case folders, this skill and the
code should be updated together.

This file is kept rather than deleted because the note it corrects still circulates. The `.codebuddy/`
harness is gone; the wrong claims about it are not.

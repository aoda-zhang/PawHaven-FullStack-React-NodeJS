## PawHaven project context

You advise on architecture, design, and review for this repo. Load the project skills before
answering — they hold decisions that are not recoverable from reading the code.

**How to review here.** The `code-review` pipeline is two passes, and each is independently
blocking:

- **TECH pass** — is the code written well? `typecheck-doctor` · `react-doctor` · `style-doctor` ·
  `i18n-doctor` · `backend-doctor` · `test-doctor` (runs on _every_ review, every scope).
- **PATTERN pass** — does the change fit the project? `boundary-doctor` · `architecture-doctor`.

`style-doctor` is the **design gate**: for UI scopes it is the only check against the
`@pawhaven/design-system` tokens, and a token violation blocks the TECH pass. Figma is not
used in this project — do not ask for a design spec, Figma JSON, or screenshots. The token
CSS in `packages/design-system/src/tokens/` is the design authority.

The review is adversarial. Attempt to break the change before confirming it. Every `MUST FIX` must
be backed by evidence. No silent polishing.

**Skills to load:** `project-rules` (routes to 8 constraint files — the authority on what must
always hold), `architecture-design` (for anything crossing a module, package, or service boundary),
`backend-standards` and `testing-standards` (for backend and test diffs), `principles`
(decision-forcing rules), plus whichever doctors match the diff's scope. `simplify` covers
clarity-only refactoring and does not replace a review.

**Repo facts worth holding:**

- Gateway `:8080` alone owns browser cookies and JWTs. It signs a short-lived **ES256** internal JWT
  into `x-gateway-jwt` (private key signs, `kid`-keyed public key verifies — not HS256, not a shared
  secret); downstream services never see browser tokens. A global `InternalJwtGuard`
  verifies it and fails closed, and rejects a structurally valid token whose `kind` is not
  `AUTHENTICATED`. Handlers read identity via `@InternalJwt()`.
  **This invariant is non-negotiable** — a change that lets a service parse a browser token is a
  `MUST FIX` regardless of how clean it looks.
- Shared types, Zod schemas, and constants live in `packages/shared` and are consumed by both
  sides. A DTO redefined on one side is a `MUST FIX`.
- `apps/frontend/admin` does not exist. Older docs claiming otherwise are stale.
- There is **no event bus** — `@nestjs/event-emitter` is not a dependency. Do not approve a design
  that assumes one.
- There is **no Jest** — the monorepo is vitest. There is also **no lint rule** stopping cross-module
  imports; the boundary has to be caught by reading.
- `pnpm test:e2e` runs Playwright but the `e2e/` directory has no specs. It passes by running
  nothing — never cite it as evidence.
- Architecture references: `docs/PawHaven-Backend-Architecture.md`,
  `docs/authentication-architecture.md`,
  `docs/PawHaven-Frontend-Architecture.md`.

**Baseline noise:** `pnpm lint` currently exits non-zero from 14 pre-existing errors (3 gateway,
11 backend-core). Confirm a diff against baseline before reporting lint as a regression you caused.

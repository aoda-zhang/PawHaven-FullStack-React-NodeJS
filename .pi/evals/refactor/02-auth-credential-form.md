# refactor-02 — One credential form behind login and register

**Category:** refactor · **Primary surface:** portal auth (`features/auth`) + `packages/i18n` ·
**Risk band:** auth surface — but presentation only, no credential or token handling

## Task prompt

> `Login.tsx` and `Register.tsx` are almost the same file with the words swapped — same two inputs,
> same button, same redirect. Extract the shared credential form so the two pages differ only in
> their copy, their mutation, and where they send you afterwards. The forms today never show you
> what went wrong when the server rejects them; while you are in there, do not invent new behaviour,
> keep it a refactor.

## Expected classification (§6)

```json
{
  "taskType": "refactor",
  "secondaryTasks": [],
  "scope": ["frontend", "i18n", "testing"],
  "complexity": "medium",
  "risk": "medium",
  "confidence": 0.8,
  "workflow": "refactoring",
  "requiredAgents": ["frontend", "tester", "reviewer"],
  "requiredVerification": [
    "pnpm --filter @pawhaven/portal test",
    "pnpm --filter @pawhaven/portal typecheck",
    "render check on /login and /register"
  ],
  "requiresClarification": false
}
```

`risk: medium` is the expected answer; `high` is acceptable if the run states that the file sits on
the auth surface (§10 floor), `low` needs a reason. `taskType: feature` is a classification failure —
in particular if the run adds password visibility toggles, a confirm-password field, a Google or
GitHub button (`auth.json` already carries `continue_with_google` / `continue_with_github` copy that
nothing renders), or OAuth. That is new user-facing behaviour and belongs in `/feature-development`
with an owner decision.

## Workflow route

`/refactoring`. The pass condition is that both pages render and submit exactly as before, and that
the shared component's parameters are the actual differences between the two pages rather than
whatever was convenient to hoist.

## Observable success criteria

1. One component owns email + password + submit for both pages. Today the duplication is literal:
   `apps/frontend/portal/src/features/auth/login/Login.tsx` and
   `apps/frontend/portal/src/features/auth/register/Register.tsx` each declare their own
   `useForm<CredentialsDto>` with `zodResolver(CredentialsSchema)`, their own two `FormInput`s with
   identical `variant`/`size`/`label`/`placeholder` wiring, and their own submit `Button`.
2. The differences are passed as parameters, and every parameter corresponds to a real difference
   between the two pages — the mutation (`useLogin` vs `useRegister`, both from
   `apps/frontend/portal/src/features/auth/api/auth.mutations.ts`), the success navigation
   (`navigate(from, { replace: true })` honouring `routeSearchParams.redirect` on login vs
   `navigate(routePaths.home, { replace: true })` on register), the `autoComplete`
   (`current-password` vs `new-password`), and the copy keys. A boolean `isRegister` that branches
   inside the shared component is a smell, not a parameterisation.
3. Validation is unchanged and still shared: `CredentialsSchema` from
   `packages/shared/types/Auth.schema.ts` remains the single resolver on both pages, and no
   component re-implements a password rule locally.
4. No hardcoded user-facing string. Both pages' visible text stays behind `useTranslation` keys in
   `packages/i18n/locales/{en-US,zh-CN,de-DE}/auth.json` — `auth.login`, `auth.login_subtitle`,
   `auth.sighup`, `auth.register_subtitle`, `auth.email`, `auth.password`, `auth.no_account`,
   `auth.register_now`, `auth.with_account`, `auth.login_now`. All three locales move together, and
   the run shows the parity check:
   `node .pi/agents/frontend/review/skills/i18n-doctor/scripts/check-locale-parity.mjs`.
5. The mutation error path is not silently changed in either direction. Today neither page reads
   `isError` from `useLogin` / `useRegister`, and neither `useRegister` nor `useLogin` has an
   `onError` in `auth.mutations.ts`. Surfacing it is a behaviour change and belongs to a follow-up
   eval; hiding it further behind an abstraction is worse. Whatever the run does, it must be stated
   in the handoff rather than slipped in.
6. `AuthLayout` stays the shared shell for both pages and the routes are untouched
   (`apps/frontend/portal/src/features/auth/route.tsx`).
7. `pnpm --filter @pawhaven/portal test` and `pnpm --filter @pawhaven/portal typecheck` green. The
   existing coverage to extend or keep is
   `apps/frontend/portal/src/features/auth/api/tests/auth.mutations.test.tsx`; there is no
   co-located test for `Login.tsx` or `Register.tsx` today, so a run adding one is welcome and a run
   adding none is a gap, not a failure.

## What a good run must produce

The duplication inventory naming every line the two files share · the shared component's prop list
with the justification for each prop · the two page files reduced to copy + mutation + navigation ·
the shared zod resolver still wired on both · the locale parity output · a test that submits the form
on at least one page · the render check on `/login` and `/register` · a `/handoff` with Doc Impact,
`update` if `docs/features/01-auth.md` describes the two forms as separate.

## Real surfaces involved

- `apps/frontend/portal/src/features/auth/login/Login.tsx`, `register/Register.tsx`,
  `AuthLayout.tsx`, `route.tsx`, `types.ts` (`ProfileType`).
- `apps/frontend/portal/src/features/auth/api/auth.mutations.ts` (`useLogin`, `useRegister`,
  `useLogout`, `toProfile` — note `accessToken: ''`, because tokens are httpOnly cookies the
  gateway owns and JS never sees), `auth.api.ts` (`/auth/login`, `/auth/register`, `/auth/logout`),
  `auth.queries.ts`, `auth.queryKeys.ts`.
- `packages/shared/types/Auth.schema.ts` — `CredentialsSchema`, `CredentialsDto`; re-exported from
  `packages/shared/types/index.ts`.
- `packages/ui/src/components/form/form-input/FormInput.tsx` — the shared input, with
  `size: 'small' | 'medium'`, `variant: 'standard' | 'outlined' | 'filled'`, and the password
  eye toggle at ~L95-100; `packages/ui/src/components/button`.
- `packages/i18n/locales/{en-US,zh-CN,de-DE}/auth.json` and `common.json`.
- `apps/frontend/portal/src/router/routePaths.ts` — `routePaths.home`, `routePaths.register`,
  `routePaths.login`, `routeSearchParams.redirect`.
- `docs/features/01-auth.md`; `docs/architecture/route_authentication.md` for the guards the pages
  sit behind.
- `apps/backend/auth-service/src/modules/auth/auth.controller.ts` and `auth.service.ts` — the other
  side of the two endpoints, read-only for this task.

## Known trap

Login and register are not mirror images. Login reads `from` out of `useSearchParams()` so a guarded
route bounces the user back where they were; register always goes home. Login also passes
`autoComplete="current-password"` where register passes `"new-password"`. A shared component that
hardcodes either one silently changes the other page's redirect behaviour, and the failure only
shows after a guard bounce — so the observable is the render check on `/login?redirect=...`, not just
`/login`. Flipping the same string in both is the most likely single-line regression here.

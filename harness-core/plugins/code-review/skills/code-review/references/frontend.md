# Frontend review

Applies when the change touches frontend source or user-visible behaviour. The **rules** are owned by
[frontend-patterns](../../../../frontend-development/skills/frontend-patterns/SKILL.md) and its
references. The React scan is an external deterministic CLI — **React Doctor** (run via `pnpm doctor:react`,
configured in `.github/workflows/react-doctor.yml`) — not a harness skill. This file is how a reviewer
detects and judges a violation of the frontend rules; it does not restate them.

## Order

1. Run the React gate. It is a hard gate for anything touching a React page, component, hook, or UI
   state.
2. Run the project-specific checks below.
3. Read the implementation references for the area the diff touches.
4. Read the diff, then the code around it.

## The React gate

```bash
npx react-doctor@0.9.12 -y --verbose --scope changed --include-untracked
```

The exact invocation, mandatory flags, and the pinned version live in
`.github/workflows/react-doctor.yml` (run locally via `pnpm doctor:react`). Read that workflow; do not
restate the command here, because the pin is the thing that must not drift.

- **Every issue the scan reports is `BLOCKING`.**
- **Paste the raw output**: the command, the project list it scanned, and the findings. A review that
  claims the gate is clean without that output has asserted nothing.
- **Verify the project list includes the app you expect.** An incomplete project list invalidates the
  scan, and an empty scan is the most common false pass.

## Project-specific checks

These enforce conventions the generic scan does not know. All are `BLOCKING`. The scripts run them;
when you run one by hand, run it from the workspace root.

| Check                                                          | Command                                                                                                             | Rule it enforces                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Server data in the Redux slice                                 | `rg -n 'state\.\w*(Response                                                                                         | List                                                                                                   | Data)' apps/frontend/portal/src --glob '_.ts' --glob '_.tsx'` | [state](../../../../frontend-development/skills/frontend-patterns/references/state.md) |
| Raw `useSelector` / `useDispatch` outside the typed hooks file | `rg -n 'useSelector\|useDispatch' apps/frontend/portal/src --glob '*.ts' --glob '*.tsx' --glob '!**/reduxHooks.ts'` | [state](../../../../frontend-development/skills/frontend-patterns/references/state.md)                 |
| Raw string query keys                                          | `rg -n "queryKey.*\[[^\]]*['\"]" apps/frontend/portal/src --glob '*.ts' --glob '*.tsx'`                             | [data-fetching](../../../../frontend-development/skills/frontend-patterns/references/data-fetching.md) |
| Field state held in `useState` instead of the form library     | `rg -n 'useState.*(form\|input\|value)' apps/frontend/portal/src --glob '*.tsx'`                                    | [forms](../../../../frontend-development/skills/frontend-patterns/references/forms.md)                 |
| Debug logging in frontend source                               | `rg -n 'console\.log' apps/frontend/portal/src --glob '*.ts' --glob '*.tsx' --glob '!*.test.*' --glob '!*.spec.*'`  | [react](../../../../frontend-development/skills/frontend-patterns/references/react.md)                 |

**Discovery is not hardcoded.** The portal is the only frontend app today, and that is a fact that
can change. Confirm the source root exists before scanning; a check that silently scanned nothing
passes everything.

**Every command returns candidates.** Open the line and judge it. The typed-hook file itself, a test
fixture, and a literal that happens to match are not violations.

## React behaviour

Read [react.md](../../../../frontend-development/skills/frontend-patterns/references/react.md) for the
rules, then judge:

- **Where does the value live?** Derived, URL, server, form, client, or local. A value in the wrong
  place is a defect even when the component renders correctly today.
- **Is an effect doing what a derived value would do?** An effect that recomputes state on every
  render is a render-loop defect.
- **Is a cleanup missing?** A subscription, timer, or observer with no teardown is a leak.
- **Does a component hold state it only passes down?** Hoist or push down; do not relay.
- **Is a key an index where the list can reorder?** A wrong key is a real defect, not a smell.

## Component boundaries

Read [components.md](../../../../frontend-development/skills/frontend-patterns/references/components.md).

- Does the component do one thing, or does it fetch, validate, and render?
- Is it in the right place: feature-private, or graduated? Placement that is wrong is a
  [boundary](./architecture.md) finding as well as a component one; file it once, under the dimension
  that owns it.
- Is a prop bag growing into a configuration object? Composition beats configuration.

## State and data fetching

Read [state.md](../../../../frontend-development/skills/frontend-patterns/references/state.md) and
[data-fetching](../../../../frontend-development/skills/frontend-patterns/references/data-fetching.md).

- Is server data in the query cache and client-only state in the store? Swapped, both are defects.
- Is every query key from the factory? A hand-written key will not be invalidated by a mutation that
  knows the factory.
- Is a mutation invalidating exactly the keys it changed, and not more?
- Is an optimistic update rolled back on failure?

## Forms

Read [forms.md](../../../../frontend-development/skills/frontend-patterns/references/forms.md) for the
rules. Judge:

- Is validation schema-first, with the same schema the backend validates against?
- Is a server error mapped back onto the field it belongs to?
- Is a multi-section form's state in one place rather than spread across sections?
- Does a failed submit leave the form editable and populated?

## Styling

Read [styling.md](../../../../frontend-development/skills/frontend-patterns/references/styling.md). The
rules there are the design gate; this repository does not use Figma, and the token source is
authoritative.

```bash
rg -n '#[0-9a-fA-F]{3,8}' apps/frontend/portal/src --glob '*.tsx' --glob '*.css'                       # blocking
rg -n '(bg|text|border|ring|outline|shadow|accent|caret|fill|stroke|placeholder|decoration)-\[var\(--color-' apps/frontend/portal/src --glob '*.tsx'   # blocking
rg -n 'style=\{\{' apps/frontend/portal/src --glob '*.tsx'                                               # blocking unless the value is runtime-computed
rg -n '(text|bg|border)-(red|blue|green|yellow|orange|gray|brown)-[0-9]+' apps/frontend/portal/src --glob '*.tsx'   # warning
rg -n '(w|h|mt|mb|ml|mr|pt|pb|pl|pr|p|m|left|right|top|bottom|gap)-\[[0-9]+px\]' apps/frontend/portal/src --glob '*.tsx'   # warning
rg -n '-\[[0-9]*\.?[0-9]+px\]' apps/frontend/portal/src --glob '*.tsx'                                    # warning, rem preferred
rg -n '(text|leading|font)-\[[0-9]+\.?[0-9]*(rem|px|em)\]' apps/frontend/portal/src --glob '*.tsx'      # warning, use the type scale
rg -n '(blur|backdrop-blur|brightness|contrast|saturate|sepia|grayscale)-\[[0-9]+' apps/frontend/portal/src --glob '*.tsx'  # warning
```

A hardcoded colour or a CSS-variable bypass is `BLOCKING`. A magic number or a raw palette name is
`MINOR`. An inline style carrying a **runtime-computed** value — a progress percentage, a measured
offset — is correct; judge each `style={{` hit rather than reporting the line.

Format drift is `MINOR`, and it is decided by the formatter rather than by reading:

```bash
npx prettier --check "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}"
```

## i18n

Read [i18n.md](../../../../frontend-development/skills/frontend-patterns/references/i18n.md) for the
rules.

```bash
rg -n '>[A-Z][a-z]+( [a-z]+)*<' apps/frontend/portal/src --glob '*.tsx' --glob '!**/*.test.tsx'   # warning
rg -n "t\(['\"][\w]+\.[\w]*[a-z][A-Z][\w]*['\"]" apps/frontend/portal/src --glob '*.ts' --glob '*.tsx'   # warning
node ../../../frontend-development/skills/frontend-patterns/scripts/check-locale-parity.mjs \
  --locales packages/i18n/locales --reference en-US                                                        # blocking
```

- **Hardcoded prose is a warning, not a blocking finding.** The scan cannot tell English prose from a
  component name, a URL, or an attribute, so every match needs the manual pass: is this visible to an
  end user? Button labels, headings, paragraphs, placeholders, error messages, empty states,
  tooltips. Attributes, URLs, component names, identifiers, and comments are not.
- **`alt` text is user-visible** and is in scope.
- **A key segment in `camelCase` is a warning.** The module prefix may stay camelCase; segments after
  the dot must be `snake_case`. `UPPER_SNAKE_CASE` error-code maps are allowed and must not be flagged.
- **Locale parity is blocking** and decided by the script, not by reading. Execute it; never read its
  source to work out what it does. A key missing from one locale renders as the raw key path there
  while looking correct everywhere else.

## Accessibility

The floor, not a feature:

- Is every interactive element reachable and operable by keyboard, with a visible focus?
- Does every control have an accessible name?
- Is a non-decorative image given alternative text, and a decorative one told to be ignored?
- Is colour the only carrier of meaning anywhere in the diff?
- Does a state change announce itself where it is not otherwise perceivable?

## What this dimension does not judge

Backend rules, boundary rules, and the general quality questions are in
[backend.md](./backend.md), [architecture.md](./architecture.md), and
[code-quality.md](./code-quality.md). Test coverage is [testing.md](./testing.md).

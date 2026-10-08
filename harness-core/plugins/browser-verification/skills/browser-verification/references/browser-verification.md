# Browser verification

How to drive the running portal. The read-only boundary, the journey checklist, and the evidence
format are the verification lane's own contract; this file is the stack it drives.

## The stack

| Fact        | Value                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Config      | `playwright.config.ts` at the repo root                                                                            |
| Runner      | `pnpm test:e2e` → `playwright test`                                                                                |
| `testDir`   | `./e2e`                                                                                                            |
| `baseURL`   | `http://localhost:3001`, overridable with `E2E_BASE_URL`                                                           |
| `webServer` | boots `pnpm --filter @pawhaven/portal dev`, waits on `baseURL`, reuses an existing server outside CI, 120s timeout |
| Project     | `chromium` (`Desktop Chrome`)                                                                                      |

`e2e/smoke.spec.ts` is the substrate: it proves the portal boots and renders its shell, and it asserts
nothing about a backend, so it runs with only the portal up. A deeper journey belongs in its own spec
file, added by the change that needs it.

**Never install a browser driver, a test framework, or any other dependency.** If a check cannot be done
with what is installed, say so in the report.

## Running it

```bash
pnpm test:e2e                          # every spec in e2e/
pnpm test:e2e e2e/smoke.spec.ts        # one spec
pnpm test:e2e --project=chromium --headed   # watch it happen
E2E_BASE_URL=http://localhost:3001 pnpm test:e2e   # a non-default port
```

When no spec covers the journey you were asked about, drive Chromium directly and report the
observation — do not add a spec to make something green:

```bash
npx playwright screenshot --full-page http://localhost:3001/ /tmp/home.png

node -e "const{chromium}=require('@playwright/test');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('http://localhost:3001/');console.log('title:',await p.title());await b.close()})()"
```

Console and network capture, on the same shape:

```js
page.on(
  'console',
  (m) => m.type() === 'error' && console.log('CONSOLE', m.text()),
);
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on(
  'response',
  (r) => r.status() >= 400 && console.log('HTTP', r.status(), r.url()),
);
```

## Preconditions

| Service       | Port | Where the port comes from                                           |
| ------------- | ---- | ------------------------------------------------------------------- |
| portal (Vite) | 3001 | `apps/frontend/portal/vite.config.ts` `server.port`                 |
| gateway       | 8080 | `apps/frontend/portal/vite.config.ts` `server.proxy['/api'].target` |

```bash
curl -s -o /dev/null -w 'portal %{http_code}\n' http://localhost:3001/
curl -s -o /dev/null -w 'gateway %{http_code}\n' http://localhost:8080/
```

- **Portal down** — start it yourself and wait for the port to answer:
  `pnpm --filter @pawhaven/portal dev &`. The foreground form is fine too, because
  `playwright.config.ts` reuses an existing server.
- **Gateway down** — the portal still renders its shell, but every `/api` call fails, so auth flows,
  forms, and real journeys cannot be verified. Start the stack with `pnpm dev:local`, which clears
  stale port holders first.
- **Stop what you started.** Leave no dev server running that you launched.
- **Chromium missing** — the Playwright browser and the portal's PDF work both need a browser binary.
  If launch fails, report the error verbatim and install nothing.

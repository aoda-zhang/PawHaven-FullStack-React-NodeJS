# Performance: how I measure it, what it found, what I changed

> This document covers **one audit, the findings I shipped, and the ones I did not**. A change is
> described as done only if it is in the tree; everything else is labelled **not shipped**, with the
> measurement that justifies it. The audit is a single snapshot of a deployed URL, not a gate.

## Getting numbers I can trust

The baseline is Lighthouse 13.4.1 with the desktop preset against `https://pawhaven.work/`, a single
cold load (desktop-preset audit) — fixed preset, deployed URL, one load, so two runs are comparable.

The first run was measured wrong, and the way it was wrong is the lesson. Three browser extensions
were loaded, and they accounted for **735.6 ms of 1,401 ms** of main-thread work — 52%
(desktop-preset audit). `unused-javascript` reported 2,619 KiB, of which the application owned
**147,840 B** (5.6%); the remainder carried `chrome-extension://` URLs. The 190 ms `forced-reflow`
entry was attributed to React DevTools' `installHook.js` (desktop-preset audit).

**Read CPU and unused-JS audits only from a clean profile.** Every main-thread number below comes
from an extension-free run; the first run stays as the example of the contamination.

| Metric | Weight | Value | Score |
| ------ | ------ | ----- | ----- |
| FCP    | 10%    | 0.7 s | 0.97  |
| LCP    | 25%    | 2.0 s | 0.64  |
| TBT    | 30%    | 60 ms | 1.00  |
| CLS    | 25%    | 0.807 | 0.05  |
| SI     | 10%    | 1.7 s | 0.76  |

Performance, weighted: **0.65** (desktop-preset audit).

The weighted table is also the priority order: CLS alone accounted for about 0.24 of the lost score —
0.65 would become roughly 0.88 if CLS were zero. LCP accounted for another ~0.09, SI ~0.02. TBT was
already 1.00, so tuning JS execution in this pass would have been wasted effort.

## The check list

The order is deliberate: each check either explains the loss the previous one found or rules it out.

| Check                 | How                                                      | Red flag                                                                         | Proves                                                  |
| --------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Score decomposition   | The weighted table above                                 | Any metric at weight ≥25% scoring below 0.9                                      | Where the loss is                                       |
| Layout-shift culprits | `cls-culprits-insight`, `layout-shifts`                  | Shift score above 0.1, or one element owning most of it                          | Which element moves, and why                            |
| LCP breakdown         | `lcp-breakdown-insight`                                  | Element render delay far larger than TTFB                                        | Whether LCP waits on the network or on my render path   |
| Critical chain        | `network-dependency-tree-insight`                        | Longest chain longer than 2 hops to the LCP resource                             | Which request is serialized behind which                |
| Payload               | `resource-summary`, `total-byte-weight`                  | An image or script dominating the total                                          | What is actually being transferred                      |
| Unused JS             | `unused-javascript`, `script-treemap-data`               | Unused bytes above 40% of a first-party chunk                                    | Whether the entry bundle carries code no route needs    |
| Images                | `image-delivery-insight`                                 | "Larger than displayed dimensions", or modern-format savings                     | Whether delivery is resizing or re-encoding             |
| Cache                 | `cache-insight`                                          | Any first-party hashed asset flagged                                             | Whether a repeat visit re-downloads what it already had |
| Main thread           | `bootup-time`, `long-tasks`, `mainthread-work-breakdown` | Any task over 200 ms                                                             | Whether the cost is my code or someone else's           |
| Third parties         | `third-parties-insight`                                  | Any entity with main-thread time                                                 | Who else ran on my page                                 |
| Document head         | View the served HTML                                     | No icon link, no `lang`, no description, or a preload the LCP element never uses | Whether the head does its job before JS runs            |

One caveat on the unused-JS row: `script-treemap-data` only breaks a chunk into modules when the
build has source maps. Without them it reports one blob for the entry, so enable `build.sourcemap`
temporarily when I need module attribution, and turn it back off.

## Finding 1 — the layout shift was a boundary, not an image (0.807 → 0)

**Shipped.** The audit recorded two shifts. The page-level `<footer>` owned **0.8071**, which is 100%
of the CLS; the footer link grid contributed 0.0651 with an unsized logo as its sub-cause
(desktop-preset audit).

The timeline explains it. First paint at 617 ms was a `fixed inset-0` spinner. The shell's header and
footer then rendered, and at about 2.0 s a full screen of content was inserted above the footer.

The root cause is one sentence: `RootLayout` wrapped only `<Outlet />` in `Suspense`, so the footer
existed before the content that determines its position.

The fix moved the footer inside the boundary. The shell is now a `flex min-h-dvh flex-col` column
with a `flex-1` content wrapper, which also made `main`'s pre-existing `flex-1` meaningful for the
first time.

"Reserve the viewport height" is the wrong instinct here. The content is roughly 3,000 px tall, so a
reserved viewport does not stop the footer from being displaced — it only delays the same move.

A second, smaller fix went in with it: the brand `<img>` got its intrinsic `width`/`height`
(1110×224), so the box is correct before decode.

| Run      | CLS       | Shift entries | Source   | Footer paint                                                |
| -------- | --------- | ------------- | -------- | ----------------------------------------------------------- |
| Baseline | **0.533** | 1             | `FOOTER` | 391 ms with content still empty, then displaced to 2,136 px |
| After    | **0.000** | 0             | —        | 1,139 / 1,207 ms, together with the content                 |

Conditions for both rows: HEAD worktree, the same production build, `/api/core/home` delayed
1,000 ms, 1440×900 viewport, 2 runs (local probe, 2 runs).

The audit's 0.807 and the local 0.533 differ in magnitude — different viewport, synthetic delay —
but they are the same failure mode and the same source element. I treat the local number as the
proof of the mechanism, not as a replacement for the field number.

## Finding 2 — the head was shipping 1.35 MB of tab icon

**Shipped**, in three parts. `favicon.ico` was **1,369,838 B**, and it was a 1049×1017 PNG renamed
to `.ico`. There was no `<link rel="icon">`, so the browser fell back to it and requested it at High
priority — inside the window where `/api/core/home` was already in flight (desktop-preset audit). It
is now a three-entry (16/32/48) 15,086 B ICO plus an opaque 180×180 `apple-touch-icon.png`, because
iOS paints transparency black. The head declares both.

The hero preload was a module-scope `preload('/images/hero-banner.webp')` in `Hero.tsx`, and it ran
on every route because the landing route is statically imported. It moved to
`<link rel="preload" media="(min-width:1024px)">` in `index.html`, so the hint is viewport-scoped and
starts during HTML parse. Verified: the built bundle contains zero `preload(` calls.

Do not over-claim that one. The `<img>` still sits in a `hidden lg:block` wrapper without
`loading="lazy"`, so the file is still downloaded at narrow viewports. Only the hint is scoped.

The document declared `lang="en"` while it renders Chinese. It is now a static `lang="zh-CN"`, with a
runtime sync from the i18n instance that follows the detected locale and in-app language switches —
verified for `en-US` and `zh-CN`.

## Finding 3 — the critical path is serialized (not shipped)

**Not shipped.** The LCP breakdown was TTFB **87 ms** and element render delay **2,113 ms**
(desktop-preset audit). The network was not the problem; my render path was.

The chain: entry bundle 106–287 ms → **22** locale chunks (11 namespaces × 2 locales) issued
564–683 ms → the app renders → `GET /api/core/home` **985.6 → 2,034.96 ms** for a 1,595 B JSON →
hero text at 2,113 ms → first rescue photo at 2,148 ms (desktop-preset audit).

That is 22 chunk requests, not one per namespace per locale including `documents/` — `documents/`
never enters the browser bundle.

`preload: ['en-US']` is measurably wasted for Chinese visitors: `fallbackLng` maps `zh-CN` to
`['zh-CN']`, so the English namespaces are fetched and never read (repo file
`packages/i18n/index.js`).

What I would change, in this order:

1. Collapse each locale to one chunk.
2. Drop the unconditional `en-US` preload.
3. Give `/api/core/home` a shared-cache lifetime, because the payload is identical for every visitor.
4. Merge the rescue list's two sequential queries.

The discipline line for all four: instrument the endpoint's per-read timings before rewriting it.
The 1,050 ms has never been attributed to Mongo, the cross-service hop, or cold start, and rewriting
on a guess would only move it.

## Route splitting: why the landing route stays eager

**Decision**, not a pending task. Six routes load through react-router 7's `route.lazy` — auth login,
auth register, rescue-cases, rescue-detail, report-animal, rescue-guide. The landing route is a static
import, and [`docs/features/02-home.md`](../features/02-home.md) records that as intent.

The measurement that looks like a problem: the entry is **1,096,891 B raw / 329,082 B transferred**
with **495,505 B (45%) unused**, and the build still warns that it exceeds 500 kB (build output;
desktop-preset audit).

The argument against the obvious fix is the same one that produced Finding 1. Making the landing
route lazy adds a round trip before the hero can exist. On the route that owns LCP, that is a
regression even though it shrinks the first response.

The rule I keep: split what the first paint does not need; never split the LCP route's own shell.

What that rule points at instead, all **not shipped** with no number claimed:

- `ReactQueryDevtools` is statically imported and therefore shipped to production, although it only
  renders in non-stable environments.
- The Lottie runtime is only there to draw the full-screen `Suspense` fallback.
- Vendor code has no `manualChunks` boundary, so every release re-hashes it.

## Images: three layers, one of them shipped (not shipped)

**Not shipped** at the layer that matters. The audit found a **1,078,978 B** photo displayed at
**372×240** from a 1670×1080 source, plus a 410,820 B one and a 76,944 B one;
`image-delivery-insight` estimated **1,397 KiB** recoverable (desktop-preset audit).

Layer 1 — front-end attributes. Shipped now, and only for the brand mark: intrinsic `width`/`height`,
and for the card `<img>`s `loading="lazy"`, `decoding="async"` and a `srcset`. The card components
currently have none of these (repo file
`apps/frontend/portal/src/pages/rescue-cases/components/CaseCard.tsx`).

Layer 2 — serve derivatives. Not shipped. Photos are base64 data URLs inside the Mongo document
(`reporterPhotos String[]`), the photo route decodes the whole array to hand back one image, and
there is no `sharp` anywhere in the repo, so every request returns the original bytes.

Layer 3 — the storage model. Not shipped. Originals in a document mean there is no CDN URL to point
at, and the gateway buffers the whole body before writing a byte because it wraps every response.

Say it plainly: the shipped change covers layer 1 only, and the 1,397 KiB is untouched.

## What was already fine

TBT 60 ms. Hashed assets already satisfy the cache audit — the only flagged request was the
Cloudflare beacon at 4 KiB. Text compression is on at the edge (1,097,187 → 329,082 B). The DOM is
223 elements at depth 14. There are no web fonts to block first paint (desktop-preset audit).

A green number is not an invitation.

## How I verify a change like this

- Build: `pnpm --filter @pawhaven/portal build`.
- Re-audit: a desktop-preset Lighthouse run from a clean profile (no extensions), same URL, same
  cold-load conditions; compare metric by metric, not just the score.
- Layout stability: a throwaway Playwright script that serves the production build, intercepts the
  home endpoint and fulfils it after 1,000 ms, injects a `layout-shift` observer through
  `addInitScript`, and reports both the session-window CLS and whether the footer exists before the
  content does. It is deliberately not committed; the numbers above are two runs of it.
- Static assertions, no browser needed: the built `index.html` must contain the icon link, `lang`,
  and the media-guarded preload, and the entry bundle must contain no `preload(` call.

## Known gaps

- No performance gate in CI. Every number here came from a manual run.
- The audited 0.807 was not reproducible off the deployed origin. The local probe produced 0.533 with
  the same source element, so the mechanism is proven but the magnitude is environment-specific.
- Mobile was never measured; only the desktop preset was.
- Per-module attribution of the entry bundle needs source maps, which the build does not emit.

## Related documents

- [`quality-gates.md`](./quality-gates.md) — the gate map, and why no gate covers performance.
- [`i18n.md`](./i18n.md) — the locale loading model behind Finding 3.
- [`../features/07-app-shell-bootstrap.md`](../features/07-app-shell-bootstrap.md) — the layout and
  `Suspense` boundary behind Finding 1.
- [`../features/02-home.md`](../features/02-home.md) — the landing route's eager import and the hero
  preload behind Findings 2 and 3.
- [`../features/04-rescue-cases.md`](../features/04-rescue-cases.md) — the card components and photo
  route behind the image findings.
- [`../context/frontend-architecture.md`](../context/frontend-architecture.md) — routing, providers
  and bundle shape.
